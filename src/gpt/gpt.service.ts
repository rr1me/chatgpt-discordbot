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

	async ask(history: object[]): Promise<{response: string, tokens: number}> {
		const response = await this.openai.createChatCompletion(<CreateChatCompletionRequest>{
			model: 'gpt-3.5-turbo-0301',
			messages: history
		});
		console.log(response.data.usage);

		return { response: response.data.choices[0].message.content, tokens: response.data.usage.total_tokens };
	}
}