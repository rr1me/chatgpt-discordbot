import { Injectable } from '@nestjs/common';
import { Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai';

@Injectable()
export class GptService {
	private readonly openai: OpenAIApi;

	constructor() {
		const configuration = new Configuration({
			organization: process.env.ORG_KEY,
			apiKey: process.env.API_KEY,
		});
		this.openai = new OpenAIApi(configuration);
	}

	async ask(msg: string): Promise<string> {
		const messages = [
			{ 'role': 'system', 'content': 'You are a helpful assistant.' },
		];
		messages.push({ 'role': 'user', 'content': msg });

		const response = await this.openai.createChatCompletion(<CreateChatCompletionRequest>{
			model: 'gpt-3.5-turbo-0301',
			messages: messages,
		});

		return response.data.choices[0].message.content;
	}
}