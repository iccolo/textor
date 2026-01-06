export interface Transformer {
	id: string;
	title: string;
	transform: (text: string) => string | Promise<string>;
}
