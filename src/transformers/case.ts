import { Transformer } from '../types';

export const caseTransformers: Transformer[] = [
	{
		id: 'toUpperCase',
		title: 'To Upper Case',
		transform: (text) => text.toUpperCase(),
	},
	{
		id: 'toLowerCase',
		title: 'To Lower Case',
		transform: (text) => text.toLowerCase(),
	},
	{
		id: 'toTitleCase',
		title: 'To Title Case',
		transform: (text) => {
			return text.replace(/\b\w/g, (char) => char.toUpperCase());
		},
	},
	{
		id: 'toCamelCase',
		title: 'To Camel Case',
		transform: (text) => {
			return text
				.replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
				.replace(/^[A-Z]/, (char) => char.toLowerCase());
		},
	},
	{
		id: 'toSnakeCase',
		title: 'To Snake Case',
		transform: (text) => {
			return text
				.replace(/([a-z])([A-Z])/g, '$1_$2')
				.replace(/[-\s]+/g, '_')
				.toLowerCase();
		},
	},
];
