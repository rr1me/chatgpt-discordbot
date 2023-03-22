import { Injectable } from '@nestjs/common';
import { ButtonStyle, ChannelType, Client, GatewayIntentBits } from 'discord.js';
import { CommandHandler } from './command.handler';
import { GptService } from '../gpt/gpt.service';

@Injectable()
export class DsBotService {
	private readonly client: Client;
	generating = false;

	private listeningChannels: string[] = ['1087826190204674190'];

	constructor(private readonly commandHandler: CommandHandler,
				private readonly gptService: GptService) {
		this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

		this.client.on('ready', () => {
			console.log(`Logged in as ${this.client.user.tag}!`);
		});

		this.client.on('interactionCreate', async interaction => {

			if (!interaction.isButton()) return;

			if (interaction.customId == 'createConversation') {
				const createdChannel = await interaction.guild.channels.create({
					name: interaction.user.username,
					type: ChannelType.GuildText,
					parent: interaction.channel.parentId,
				});
				this.listeningChannels.push(createdChannel.id);
			}
		});

		this.client.on('messageCreate', async msg => {
			const content = msg.content;
			if (content.startsWith('!')) this.commandHandler.handle(content);
			if (this.listeningChannels.includes(msg.channelId) && !msg.author.bot) {
				if (this.generating) {
					await msg.reply('msg already generating');
					return;
				}
				const generationMsg = await msg.reply('Generating...');

				this.generating = true;

				const response = await this.gptService.ask(content);

				console.log(response.length);

				if (response.length < 2000)
					await generationMsg.edit(response);
				else {
					const responseBlocks = response.split('\n\n');

					const messageBlocks: string[] = [''];
					let currentMsgBlockLength = 0;

					for (let v of responseBlocks) {
						currentMsgBlockLength += v.length;

						const i = messageBlocks.length - 1;
						if (currentMsgBlockLength > 1800) {
							const multilines = messageBlocks[i].match(/```/g);
							const multilineCount = multilines ? multilines.length : 0;

							if (multilineCount % 2 !== 0) {
								messageBlocks[i] = messageBlocks[i] + '```';
								v = '```' + v;
							}

							messageBlocks.push(v);
							currentMsgBlockLength = v.length;
						} else {
							messageBlocks[i] += '\n\n' + v;
						}
					}

					for (let i = 0; i < messageBlocks.length; i++) {
						const v = messageBlocks[i];
						if (v === '')
							continue;
						if (i === 0)
							await generationMsg.edit(v);
						else
							await msg.channel.send(v);
					}
				}
				this.generating = false;
			}
		});
	}

	async init() {
		await this.client.login(process.env.BOT_TOKEN);

		// const channel = await this.client.channels.fetch('1087790921992642742') as TextChannel;

		// const row = new ActionRowBuilder<ButtonBuilder>()
		// 	.addComponents(
		// 		new ButtonBuilder()
		// 			.setCustomId('createConversation')
		// 			.setLabel('Create conversation')
		// 			.setStyle(ButtonStyle.Primary),
		// 	);
		// await channel.send({
		// 	content: 'q',
		// 	components: [row],
		// });
	}
}