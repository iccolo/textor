import { Transformer } from '../types';

function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function parseDate(dateStr: string): Date {
	const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
	if (!match) {
		throw new Error('日期格式不正确，请使用 YYYY-MM-DD HH:mm:ss 格式');
	}
	const [, year, month, day, hours, minutes, seconds] = match;
	return new Date(
		parseInt(year),
		parseInt(month) - 1,
		parseInt(day),
		parseInt(hours),
		parseInt(minutes),
		parseInt(seconds)
	);
}

export const timestampTransformers: Transformer[] = [
	{
		id: 'timestampToDate',
		title: 'Timestamp to Date',
		transform: (text) => {
			const timestamp = parseInt(text.trim(), 10);
			if (isNaN(timestamp)) {
				throw new Error('无效的时间戳');
			}
			// 自动判断秒级或毫秒级时间戳
			const ts = timestamp > 9999999999 ? timestamp : timestamp * 1000;
			return formatDate(new Date(ts));
		},
	},
	{
		id: 'dateToTimestamp',
		title: 'Date to Timestamp',
		transform: (text) => {
			const date = parseDate(text.trim());
			return Math.floor(date.getTime() / 1000).toString();
		},
	},
];
