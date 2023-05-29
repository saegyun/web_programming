$(document).ready(() => {
	const enchants = [
		{
			value: 4,
			sharpness: 1,
			text: "꽝",
		},
		{
			value: 4,
			sharpness: 1,
			text: "날카로움 I",
		},
		{
			value: 5,
			sharpness: 2,
			text: "날카로움 II",
		},
		{
			value: 3,
			sharpness: 3,
			text: "날카로움 III",
		},
		{
			value: 2,
			sharpness: 4,
			text: "날카로움 IIII",
		},
		{
			value: 1,
			sharpness: 5,
			text: "날카로움 V",
		}
	];

	$("#role").on("click", function() {

		if (PlayStatus.stat.exp < 500) {
			alert("EXP가 부족합니다!");
			return;
		}

		PlayStatus.stat.exp -= 500;
		$("#show-exp").text(`Current Exp : ${PlayStatus.stat.exp}`);

		let max = 1;
		
		switch(PlayStatus.stage2.result) {
			case "stone":
				max = 2;
				break;
			case "iron":
				max = 3;
				break;
			case "gold":
				max = 4;
				break;
			case "diamond":
				max = 5;
				break;
		}
		const role = () => {
			let total = 0;
			let sum = 0;
			let i;
			let isDecided = false;

			for (i = 0; i <= max; i++) {
				total += enchants[i].value;
			}

			const random = Math.random();
			console.log("current rand : ", random);

			for (i = 0; i <= max; i++) {
				sum += enchants[i].value / total;
				console.log(sum, random);
				if (random > sum) {
					$("#enchant-result").text(enchants[i].text);
					if (i === 0) {
						new Audio("resource/sound/item_break.ogg").play();
						return;
					}
					isDecided = true;
					PlayStatus.stat.sharpness = enchants[i].sharpness;
					break;
				}
			}
			if (!isDecided) {
				$("#enchant-result").text(enchants[max].text);
				PlayStatus.stat.sharpness = enchants[max].sharpness;
			}
			new Audio("resource/sound/experience.ogg").play();
		}

		let idx = 0;

		const id = setInterval(() => {
			$("#enchant-result").text(enchants[(idx++) % (max + 1)].text);
			new Audio("resource/sound/item_pop.ogg").play();
			if (idx > 80) {
				clearInterval(id);
				role();
			}
		}, 40);
	})
});