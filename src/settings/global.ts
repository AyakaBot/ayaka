export {};

declare global {
	const animated: true;
	const withResponse: true;
	const flags: ["Ephemeral"];
	const required: true;
	const inline: true;
	const disabled: true;
	const charInvisible: string
}

Object.assign(globalThis, Object.freeze({
	animated: true,
	withResponse: true,
	flags: ["Ephemeral"],
	required: true,
	inline: true,
	disabled: true,
	charInvisible: "ㅤ"
}));