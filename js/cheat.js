
console.log("콘솔에 오신 것을 환영합니다!");
console.log("이곳에서 치트를 사용하여 게임을 빠르게 진행할 수 있습니다.");
console.log("아래 함수들을 사용할 수 있습니다.");
console.log("cheatIncreaseXP(xp) : 주어진 xp만큼 XP를 증가시킵니다. XP는 인챈트에서 사용할 수 있습니다.");
console.log("cheatSetSharpness(sharpness) : 주어진 sharpness로 Sharpness를 변화시킵니다. 공의 공격력을 변화시킬 수 있습니다. (공의 공격력: Sharpness * 1.5 + 3)");
console.log("cheatChangeOre(num) : 현재 Stage 2에서 얻은 광물의 종류를 num에 따라 변화시킵니다. (0은 wood, 1은 stone, 2는 iron, 3은 gold, 4는 diamond)");

function cheatIncreaseXp(xp) {
	if(typeof xp === 'number' && isFinite(xp)) {
		PlayStatus.stat.exp += xp;
		console.log("XP가 " + xp + "만큼 증가하였습니다!");
		console.log("현재 XP: " + PlayStatus.stat.exp);
		new Audio("resource/sound/experience.ogg").play();
	}
	else {
		console.log("인수가 숫자가 아닙니다. 다시 시도해 주십시오.");
	}
}

function cheatSetSharpness(sharpness) {
	if(typeof sharpness === 'number' && isFinite(sharpness)) {
		PlayStatus.stat.sharpness = sharpness;
		console.log("Sharpness가 " + sharpness + "이 되었습니다!");
		console.log("현재 Sharpness: " + PlayStatus.stat.sharpness);
		console.log("현재 공격력: " + getPlayerDamage());
		new Audio("resource/sound/experience.ogg").play();
	}
	else {
		console.log("인수가 숫자가 아닙니다. 다시 시도해 주십시오.");
	}
}

function cheatChangeOre(num) {
	if(typeof num === 'number' && isFinite(num)) {
		switch(num) {
			case 0:
				PlayStatus.stage2.result = "wood";
				break;
			case 1:
				PlayStatus.stage2.result = "stone";
				break;
			case 2:
				PlayStatus.stage2.result = "iron";
				break;
			case 3:
				PlayStatus.stage2.result = "gold";
				break;
			case 4:
				PlayStatus.stage2.result = "diamond";
				break;
			default:
				console.log("아무 광물에도 해당되지 않습니다. 다시 시도해 주십시오.");
				return;
		}
		console.log("현재 Stage 2에서 얻은 광물의 종류가 " + PlayStatus.stage2.result + "이(가) 되었습니다!");
		new Audio("resource/sound/experience.ogg").play();
	}
	else {
		console.log("인수가 숫자가 아닙니다. 다시 시도해 주십시오.");
	}
}
