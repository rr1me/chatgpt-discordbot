import { Injectable } from '@nestjs/common';
import { ChannelType, Client, GatewayIntentBits, GuildTextBasedChannel, Message } from 'discord.js';
import { CommandHandler } from './command.handler';
import { GptService } from '../gpt/gpt.service';

@Injectable()
export class DsBotService {
	private readonly client: Client;
	generating = false;

	private readonly PARENT_CHANNEL_ID = '772692848529244191';
	private readonly ORCHESTRATOR_CHANNEL_ID = '1087790921992642742';
	private readonly NO_HISTORY_CHANNEL_ID = '1088183220153094285';

	private readonly basicHistory = [{ 'role': 'system', 'content': 'You are a helpful assistant.' }];

	constructor(private readonly commandHandler: CommandHandler,
				private readonly gptService: GptService) {
		this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

		this.client.on('ready', () => {
			console.log(`Logged in as ${this.client.user.tag}!`);
		});

		this.client.on('interactionCreate', async interaction => {
			if (!interaction.isButton()) return;

			const today = new Date();
			if (interaction.customId == 'createConversation') {
				await interaction.guild.channels.create({
					name: `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear().toString().substring(2)}_${today.getHours()}-${today.getMinutes()}`,
					type: ChannelType.GuildText,
					parent: interaction.channel.parentId,
				});
			}
		});

		this.client.on('messageCreate', async msg => {
			const content = msg.content;
			if (content.startsWith('!')) this.commandHandler.handle(content);

			const channelMessages = await msg.channel.messages.fetch();

			const at = msg.channel.messages.valueOf().at(1);
			if (at !== undefined && at.author.bot && at.content.startsWith('[x]')){
				await msg.delete();
				return;
			}

			const channelId = msg.channelId;
			const parentId = (msg.channel as GuildTextBasedChannel).parentId;
			if (parentId === this.PARENT_CHANNEL_ID && channelId !== this.ORCHESTRATOR_CHANNEL_ID && !msg.author.bot) {
				if (this.generating) {
					await msg.delete();
					return;
				}
				const generationMsg = await msg.reply('[#]Generating...');

				this.generating = true;

				let history = this.basicHistory.slice();
				if (channelId === this.NO_HISTORY_CHANNEL_ID) {
					history.push({ 'role': 'user', 'content': content });
				} else {
					for (const v of channelMessages.reverse()) {
						const msg = v[1] as Message;
						if (msg.content.startsWith('[#]')) continue;

						if (msg.author.bot && msg.mentions.repliedUser === null){
							const i = history.length-1;
							const content = history[i].content;
							history[i].content = content + '\n\n' + msg.content;

						} else
							history.push({ 'role': msg.author.bot ? 'assistant' : 'user', 'content': msg.content })
					}
				}
				console.log(history);

				let r;
				try{
					r = await this.gptService.ask(history);
				}catch (e){
					await msg.reply('[#]Error: ' + e.message)
					return;
				}
				const {response, tokens} = r;

				console.log(response.length);
				console.log(tokens);

				if (response.length < 2000)
					await generationMsg.edit(response);
				else {
					const responseBlocks = response.split('\n\n');

					const messageBlocks: string[] = [''];
					let currentMsgBlockLength = 0;

					for (let v of responseBlocks) {
						currentMsgBlockLength += v.length;

						const i = messageBlocks.length - 1;
						if (currentMsgBlockLength > 1500) {
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
				if (tokens > 3500) msg.channel.send(`[x]Tokens: ${tokens}. Conversation closed.`)
				this.generating = false;
			}
		});
	}

	async init() {
		await this.client.login(process.env.BOT_TOKEN);
	}
}