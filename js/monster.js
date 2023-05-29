
// 몹에 대한 부모 클래스
class Mob {
	constructor(x, y, maxHealth, damage, speed, width, height, maxFrame, frameWidth, frameHeight, exp) {
		this.x = x;
		this.y = y;
		this.maxHealth = maxHealth; // 몹 전체 체력
		this.health = maxHealth; // 몹 실제 체력
		this.damage = damage; // 몹 공격력
		this.speed = speed; // 몹이 걸어오는 속도
		this.width = width;
		this.height = height;
		this.exp = exp; // 몹 경험치
		this.status = ""; // 몹 현재 상태 - "hurt"면 최근에 맞은 상태, "death"면 죽은 상태, ""이면 기본 상태
		this.hitTimer = 0; // 몹이 맞았을 때 빨간색 오버레이(hurtSprite) 유지 시간
		this.currentFrame = 0; // sprite animation에서 현재 프레임
		this.animationTime = 0; // sprite animation을 너무 빠르게 진행시키지 않기 위한 변수
		this.maxFrame = maxFrame; // sprite animation의 sprite개수
		this.frameWidth = frameWidth; // sprite 1개의 가로 길이
		this.frameHeight = frameHeight; // sprite 1개의 세로 길이
	}
}
// 몹을 canvas에 그리기 위한 함수
Mob.prototype.draw = function(context, idleSprite, hurtSprite) {
	let sprite;
	switch(this.status) { // 몹의 상태에 따라 다른 sprite 적용
		case "hurt":
			if(this.hitTimer > 0) { // 빨간색 오버레이(hurtSprite) 유지 시간
				this.hitTimer -= 1;
				sprite = hurtSprite;
			}
			else {
				this.status = "";
				sprite = idleSprite;
			}
			break;
		default:
			sprite = idleSprite;
	}
	//context.fillRect(this.x, this.y, this.width, this.height); // Hitbox 체크를 위한 디버그 함수
	// 캔버스에 몹 sprite 그리기
	context.drawImage(
		sprite, // Image
		this.currentFrame * this.frameWidth, // Source x
		0, // Source y
		this.frameWidth, // Source width
		this.frameHeight, // Source height
		this.x, // Destination x
		this.y, // Destination y
		this.width, // Destination width
		this.height // Destination height
	);
	if(this.animationTime >= 10) { // sprite animation이 너무 빠르게 진행되지 않도록 함
		this.animationTime = 0;
		this.currentFrame = (this.currentFrame + 1) % this.maxFrame;
	}
	else {
		this.animationTime += 1;
	}
	
	// 체력바 그리기
	context.fillStyle = "#630000"; // 체력바 배경
	context.fillRect(this.x, this.y - 30, this.width, 10);
	
	context.fillStyle = "#ff0000"; // 실제 체력
	context.fillRect(this.x, this.y - 30, this.width * (this.health / this.maxHealth), 10);
	
}
// 몹 소리내기
Mob.prototype.say = function(idleAudios) {
	if (this.status !== "death") {
		let idleAudio = idleAudios[Math.floor(Math.random() * idleAudios.length)];
		idleAudio.play();
	}
}
// 몹이 공에 맞았을 때를 위한 함수
Mob.prototype.hit = function(damage, hurtAudios, deathAudios) {
	this.health -= damage;
	
	if(this.health <= 0) // 몹이 체력을 다 잃고 죽었을 때 - true반환
	{
		this.status = "death"; // 몹 상태를 "death"로 변경
		let deathAudio = deathAudios[Math.floor(Math.random() * deathAudios.length)];
		deathAudio.play();
		// increase exp
		
		return true;
	}
	else // 몹이 죽지 않은 상태 (그냥 맞았을 때)
	{
		this.status = "hurt"; // 몹 상태를 "hurt"로 변경
		this.hitTimer = 20; // 20 frame 동안 draw에서 빨간색 오버레이(hurtSprite) 유지
		let hurtAudio = hurtAudios[Math.floor(Math.random() * hurtAudios.length)];
		hurtAudio.play();
		return false;
	}
}
// 경험치 라벨 - 몹이 죽었을 때 표시됨
class ExperienceLabel {
	constructor(x, y, exp) {
		this.x = x;
		this.y = y;
		this.text = "+" + exp + "XP";
		this.expTimer = 40; // 경험치 라벨이 너무 빠르게 없어지지 않게 하기 위한 변수
	}
	static font = "bold 20px Arial";
	static textColor = "#7bf318";
	static expAudio = new Audio("resource/sound/experience.ogg");
}
// 소리 내기
ExperienceLabel.prototype.ding = function() {ExperienceLabel.expAudio.play() }
// 경험치 라벨 그리기
ExperienceLabel.prototype.draw = function(context) {
	if(this.expTimer > 0)
	{
		context.font = ExperienceLabel.font;
		context.fillStyle = ExperienceLabel.textColor;
		context.fillText(this.text, this.x, this.y);
		this.expTimer -= 1;
		return false;
	}
	else
		return true;
}