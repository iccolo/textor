import { Transformer } from '../types';
import { base64Transformers } from './base64';
import { jsonTransformers } from './json';
import { urlTransformers } from './url';
import { escapeTransformers } from './escape';
import { unicodeTransformers } from './unicode';
import { timestampTransformers } from './timestamp';
import { ipTransformers } from './ip';
import { sqlTransformers } from './sql';
import { caseTransformers } from './case';
import { protobufTransformers } from './protobuf';
import { hexTransformers } from './hex';

export const transformers: Transformer[] = [
	...base64Transformers,
	...jsonTransformers,
	...urlTransformers,
	...escapeTransformers,
	...unicodeTransformers,
	...timestampTransformers,
	...ipTransformers,
	...sqlTransformers,
	...caseTransformers,
	...protobufTransformers,
	...hexTransformers,
];
