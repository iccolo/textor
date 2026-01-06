import * as assert from 'assert';
import { protobufTransformers } from '../transformers/protobuf';

const hexToProtobufFn = protobufTransformers.find(t => t.id === 'hexToProtobuf')!.transform;
const protobufToHexFn = protobufTransformers.find(t => t.id === 'protobufToHex')!.transform;

const hexToProtobuf = (text: string): string => hexToProtobufFn(text) as string;
const protobufToHex = (text: string): string => protobufToHexFn(text) as string;

suite('Protobuf Transformer Test Suite', () => {

	suite('Hex to Protobuf', () => {

		test('解码简单字符串字段', () => {
			const hex = '0a0548656c6c6f';
			const result = hexToProtobuf(hex);
			assert.strictEqual(result, '1: "Hello"');
		});

		test('解码简单整数字段 (varint)', () => {
			const hex = '1064';
			const result = hexToProtobuf(hex);
			assert.strictEqual(result, '2: 100');
		});

		test('解码多个字段', () => {
			const hex = '0a0548656c6c6f10641a03666f6f';
			const result = hexToProtobuf(hex);
			assert.ok(result.includes('1: "Hello"'));
			assert.ok(result.includes('2: 100'));
			assert.ok(result.includes('3: "foo"'));
		});

		test('解码大整数 (varint)', () => {
			const hex = '08ac02';
			const result = hexToProtobuf(hex);
			assert.strictEqual(result, '1: 300');
		});

		test('解码嵌套消息', () => {
			// field 1: nested { field 1: 42 }
			const hex = '0a02082a';
			const result = hexToProtobuf(hex);
			// 新格式：使用缩进
			assert.ok(result.includes('1:'));
			assert.ok(result.includes('  1: 42'));
		});

		test('解码 bytes 字段', () => {
			const hex = '0a04ff00ff00';
			const result = hexToProtobuf(hex);
			assert.ok(result.includes('0xff00ff00'));
		});

		test('支持带空格的输入', () => {
			const hex = '0a 05 48 65 6c 6c 6f';
			const result = hexToProtobuf(hex);
			assert.strictEqual(result, '1: "Hello"');
		});

		test('支持带 0x 前缀的输入', () => {
			const hex = '0x0a0548656c6c6f';
			const result = hexToProtobuf(hex);
			assert.strictEqual(result, '1: "Hello"');
		});

		test('错误处理：奇数长度', () => {
			assert.throws(() => {
				hexToProtobuf('0a054');
			}, /十六进制字符串长度必须为偶数/);
		});

		test('错误处理：无效十六进制字符', () => {
			assert.throws(() => {
				hexToProtobuf('0a05gg');
			}, /包含无效的十六进制字符/);
		});

		test('错误处理：字段编号为 0', () => {
			assert.throws(() => {
				hexToProtobuf('00');
			}, /字段编号不能为 0/);
		});

		test('错误处理：无效 wire type', () => {
			assert.throws(() => {
				hexToProtobuf('0f');
			}, /无效的 wire type/);
		});

		test('解码中文字符串', () => {
			const hex = '0a06e4bda0e5a5bd';
			const result = hexToProtobuf(hex);
			assert.strictEqual(result, '1: "你好"');
		});

	});

	suite('Protobuf to Hex', () => {

		test('编码简单字符串字段', () => {
			const input = '1: "Hello"';
			const result = protobufToHex(input);
			assert.strictEqual(result, '0a0548656c6c6f');
		});

		test('编码简单整数字段', () => {
			const input = '2: 100';
			const result = protobufToHex(input);
			assert.strictEqual(result, '1064');
		});

		test('编码多个字段', () => {
			const input = `1: "Hello"
2: 100
3: "foo"`;
			const result = protobufToHex(input);
			assert.strictEqual(result, '0a0548656c6c6f10641a03666f6f');
		});

		test('编码大整数', () => {
			const input = '1: 300';
			const result = protobufToHex(input);
			assert.strictEqual(result, '08ac02');
		});

		test('编码嵌套消息 (缩进格式)', () => {
			const input = `1:
  1: 42`;
			const result = protobufToHex(input);
			assert.strictEqual(result, '0a02082a');
		});

		test('编码 bytes 字段', () => {
			const input = '1: 0xff00ff00';
			const result = protobufToHex(input);
			assert.strictEqual(result, '0a04ff00ff00');
		});

		test('编码中文字符串', () => {
			const input = '1: "你好"';
			const result = protobufToHex(input);
			assert.strictEqual(result, '0a06e4bda0e5a5bd');
		});

		test('错误处理：空输入', () => {
			assert.throws(() => {
				protobufToHex('');
			}, /未找到有效的 protobuf 字段/);
		});

		test('错误处理：无效格式', () => {
			assert.throws(() => {
				protobufToHex('invalid input');
			}, /未找到有效的 protobuf 字段/);
		});

	});

	suite('双向转换', () => {

		test('字符串字段往返转换', () => {
			const original = '0a0548656c6c6f';
			const decoded = hexToProtobuf(original);
			const encoded = protobufToHex(decoded);
			assert.strictEqual(encoded, original);
		});

		test('整数字段往返转换', () => {
			const original = '1064';
			const decoded = hexToProtobuf(original);
			const encoded = protobufToHex(decoded);
			assert.strictEqual(encoded, original);
		});

		test('多字段往返转换', () => {
			const original = '0a0548656c6c6f10641a03666f6f';
			const decoded = hexToProtobuf(original);
			const encoded = protobufToHex(decoded);
			assert.strictEqual(encoded, original);
		});

		test('嵌套消息往返转换', () => {
			const original = '0a02082a';
			const decoded = hexToProtobuf(original);
			const encoded = protobufToHex(decoded);
			assert.strictEqual(encoded, original);
		});

		test('修改字段后重新编码', () => {
			const original = '0a0548656c6c6f1064';
			const decoded = hexToProtobuf(original);
			
			// 修改值
			const modified = decoded.replace('"Hello"', '"World"').replace('100', '200');
			const encoded = protobufToHex(modified);
			
			// 验证新的 hex
			const decodedAgain = hexToProtobuf(encoded);
			assert.ok(decodedAgain.includes('"World"'));
			assert.ok(decodedAgain.includes('200'));
		});

	});

});
