import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Configuration, OpenAIApi } from 'openai';
import { Client, REST, Routes, GatewayIntentBits  } from 'discord.js';

(async () => {
	const app = await NestFactory.createApplicationContext(AppModule);
	// await app.listen(3000);

	await app.close();

	// const configuration = new Configuration({
	// 	organization: process.env.ORG_KEY,
	// 	apiKey: process.env.API_KEY,
	// });
	// const openai = new OpenAIApi(configuration);
	// const response = await openai.createChatCompletion({
	// 	model: 'gpt-3.5-turbo-0301',
	// 	messages: [
	// 		{ 'role': 'system', 'content': 'You are a helpful assistant.' },
	// 		{ 'role': 'user', 'content': 'Who won the world series in 2020?' },
	// 		{ 'role': 'assistant', 'content': 'The Los Angeles Dodgers won the World Series in 2020.' },
	// 		{ 'role': 'user', 'content': 'Where was it played?' },
	// 	],
	// });
	// const response = await openai.listModels();
	// console.log(response);
})();
