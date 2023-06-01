
$(document).ready(function() {
	const reCalc = () => {
		mousePadding = ($(window).width() - $("#myCanvas").width()) / 2;
	};
	reCalc();

	$(window).on("resize", () => {
		reCalc();
	});

	// <button class="next">stage1</button>을 클릭하면 게임 시작
	$(".level-btn").on("click", function() {
		if (currentStage === "stage 3") {
			menuMusic.pause();
			moveNext(2);
			$(window).on("mousemove", event => {
				mousePos = [
					event.pageX,
					event.pageY
				];
			});
			Stage3.gameOn = true; // 스테이지를 시작하면 게임이 진행 중인 것으로 취급
			Stage3.startGame($(this).val(), () => {
				$(window).off("mousemove");
			});
		}
	});
	
	$("#stage3 .back").on("click", () => {
		menuMusic.play();
		Stage3.gameOn = false; // 스테이지를 나가면 게임이 끝난 것으로 취급, 아래 코드에서 루프 종료
		const canvas = document.getElementById("myCanvas");
		const context = canvas.getContext("2d");
		
		Stage3.gameEnd(context);
	});
});


// 스테이지3에 대한 총괄 함수
const Stage3 = {
	gameOn: false,
	// 게임이 승패가 갈리기 전에 스테이지를 나갔을 때 호출할 함수
	gameEnd: function(context) {
		$("#screen #stage3_time").remove();
		$("#screen #stage3_exp").remove();
		$("#screen #stage3_volume").remove();
		setTimeout(() => {
			context.clearRect(0, 0, maxWidth, maxHeight); // canvas 지우기			
		}, 10);
		$(window).off("mousemove");
	},
	startGame: function (currentLevel, callBack) {
		// 클래스, 함수들 정의
		// 공에 대한 클래스
		class Ball {
			constructor(x, y, radius, damage, speed) {
				this.x = x;
				this.y = y;
				this.radius = radius;
				this.damage = damage; // 몬스터에 대한 공격력
				this.speed = speed;
				Ball.ballImage.src = "resource/sprite/ball_diamond.png"; // 임시 공 텍스쳐
			}
			static ballImage = new Image();
		}
		
		Ball.prototype.draw = function(context) {
			context.drawImage(
				Ball.ballImage, // Image
				this.x - this.radius, // Destination x
				this.y - this.radius, // Destination y
				this.radius * 2, // Destination width
				this.radius * 2 // Destination height
			);
		}
		/* 모든 직사각형, 이미지의 구성
		(0, 0)--|
		|		|
		----(좌표 x, y)-----(width)----------|
				|							|
				|							|
				|							|
			(height) (직사각형 넓이만큼 hitbox)	|
				|							|
				|							|
				-----------------------------
		*/
		// 패들에 대한 클래스
		class Bar {
			constructor(x, y, width, height) {
				this.x = x;
				this.y = y;
				this.width = width;
				this.height = height;
				Bar.barImage.src = "resource/sprite/paddle_slime.png";
			}
			static barImage = new Image();
			static barCollideAudios = [new Audio("resource/sound/slime_paddle_1.ogg"), new Audio("resource/sound/slime_paddle_2.ogg"), new Audio("resource/sound/slime_paddle_3.ogg"), new Audio("resource/sound/slime_paddle_4.ogg")];
		}
		
		Bar.prototype.draw = function(context) {
			context.drawImage(
				Bar.barImage, // Image
				this.x, // Destination x
				this.y, // Destination y
				this.width, // Destination width
				this.height // Destination height
			);
		}
		
		Bar.prototype.collideSound = function() {
			Bar.barCollideAudios[Math.floor(Math.random() * Bar.barCollideAudios.length)].play();
		}
		// 좀비 몹 클래스, 몹 클래스 상속
		class MobZombie extends Mob {
			constructor(x, y, maxHealth, damage, speed, width, height, exp) {
				super(x, y, maxHealth, damage, speed, width, height, 8, 360, 360, exp); // Mob 클래스의 생성자 호출
				MobZombie.idleSprite.src = "resource/sprite/zombie_idle.png"; // 걷는 sprite
				MobZombie.hurtSprite.src = "resource/sprite/zombie_hurt.png"; // 맞았을 때 sprite
			}
			static spawnWeight = 25; // 생성 비중, 아래 spawnMob()함수에서 설명
			static idleSprite = new Image(); 
			static hurtSprite = new Image();
			static idleAudios = [new Audio("resource/sound/zombie_idle_1.ogg"), new Audio("resource/sound/zombie_idle_2.ogg"), new Audio("resource/sound/zombie_idle_3.ogg")]; // 생성될 때 소리
			static hurtAudios = [new Audio("resource/sound/zombie_hurt_1.ogg"), new Audio("resource/sound/zombie_hurt_2.ogg")]; // 맞았을 때 소리
			static deathAudios = [new Audio("resource/sound/zombie_death.ogg")]; // 죽었을 때 소리
			static attackAudios = [new Audio("resource/sound/zombie_attack_1.ogg"), new Audio("resource/sound/zombie_attack_2.ogg"), new Audio("resource/sound/zombie_attack_3.ogg")]; // 마을을 때릴 때 소리
		
			draw(context) { // 캔버스에 그리기, Mob 클래스의 draw() 호출
				super.draw(context, MobZombie.idleSprite, MobZombie.hurtSprite);
			}
		
			sayIdle() { // 생성할 때 소리 내기
				super.say(MobZombie.idleAudios);
			}
			
			sayAttack() { // 마을에 도착했을 때 소리 내기
				super.say(MobZombie.attackAudios);
			}
		
			hit(damage) { // 몹이 맞았을 때 함수, hit() 함수의 결과 반환 (죽으면 true, 아직 살아있으면 false) 
				return super.hit(damage, MobZombie.hurtAudios, MobZombie.deathAudios);
			}
		}
		// 거미 몹 클래스, 몹 클래스 상속
		class MobSpider extends Mob {
			constructor(x, y, maxHealth, damage, speed, width, height, exp) {
				super(x, y, maxHealth, damage, speed, width, height, 4, 600, 440, exp);
				MobSpider.idleSprite.src = "resource/sprite/spider_idle.png";
				MobSpider.hurtSprite.src = "resource/sprite/spider_hurt.png";
			}
			static spawnWeight = 15;
			static idleSprite = new Image();
			static hurtSprite = new Image();
			
			static idleAudios = [new Audio("resource/sound/spider_idle_1.ogg"), new Audio("resource/sound/spider_idle_2.ogg"), new Audio("resource/sound/spider_idle_3.ogg"), new Audio("resource/sound/spider_idle_4.ogg")];
			static hurtAudios = MobSpider.idleAudios;
			static deathAudios = [new Audio("resource/sound/spider_death.ogg")];
			static attackAudios = [new Audio("resource/sound/spider_attack_1.ogg"), new Audio("resource/sound/spider_attack_2.ogg")];
			
			draw(context) {
				super.draw(context, MobSpider.idleSprite, MobSpider.hurtSprite);
			}
			
			sayIdle() {
				super.say(MobSpider.idleAudios);
			}
			
			sayAttack() {
				super.say(MobSpider.attackAudios);
			}
			
			hit(damage) {
				return super.hit(damage, MobSpider.hurtAudios, MobSpider.deathAudios);
			}
		}
		// 크리퍼 몹 클래스, 몹 클래스 상속
		class MobCreeper extends Mob {
			constructor(x, y, maxHealth, damage, speed, width, height, exp) {
				super(x, y, maxHealth, damage, speed, width, height, 8, 360, 360, exp);
				MobCreeper.idleSprite.src = "resource/sprite/creeper_idle.png";
				MobCreeper.hurtSprite.src = "resource/sprite/creeper_hurt.png";
			}
			static spawnWeight = 20;
			static idleSprite = new Image();
			static hurtSprite = new Image();
			static idleAudios = [new Audio("resource/sound/creeper_idle_1.ogg"), new Audio("resource/sound/creeper_idle_2.ogg"), new Audio("resource/sound/creeper_idle_3.ogg"), new Audio("resource/sound/creeper_idle_4.ogg")];
			static hurtAudios = MobCreeper.idleAudios;
			static deathAudios = [new Audio("resource/sound/creeper_death.ogg")];
			static attackAudios = [new Audio("resource/sound/creeper_attack_1.ogg"), new Audio("resource/sound/creeper_attack_2.ogg"), new Audio("resource/sound/creeper_attack_3.ogg"), new Audio("resource/sound/creeper_attack_4.ogg")];
			
			draw(context) {
				super.draw(context, MobCreeper.idleSprite, MobCreeper.hurtSprite);
			}
			
			sayIdle() {
				super.say(MobCreeper.idleAudios);
			}
			
			sayAttack() {
				super.say(MobCreeper.attackAudios);
			}
			
			hit(damage) {
				return super.hit(damage, MobCreeper.hurtAudios, MobCreeper.deathAudios);
			}
		}
		// 우민 몹 클래스, 몹 클래스 상속
		class MobVindicator extends Mob {
			constructor(x, y, maxHealth, damage, speed, width, height, exp) {
				super(x, y, maxHealth, damage, speed, width, height, 8, 270, 380, exp);
				MobVindicator.idleSprite.src = "resource/sprite/vindicator_idle.png";
				MobVindicator.hurtSprite.src = "resource/sprite/vindicator_hurt.png";
			}
			static spawnWeight = 10;
			static idleSprite = new Image(); 
			static hurtSprite = new Image();
			static idleAudios = [new Audio("resource/sound/vindicator_idle_1.ogg"), new Audio("resource/sound/vindicator_idle_2.ogg"), new Audio("resource/sound/vindicator_idle_3.ogg"), new Audio("resource/sound/vindicator_idle_4.ogg")];
			static hurtAudios = [new Audio("resource/sound/vindicator_hurt_1.ogg"), new Audio("resource/sound/vindicator_hurt_2.ogg"), new Audio("resource/sound/vindicator_hurt_3.ogg")];
			static deathAudios = [new Audio("resource/sound/vindicator_death_1.ogg"), new Audio("resource/sound/vindicator_death_2.ogg")];
			static attackAudios = [new Audio("resource/sound/vindicator_attack_1.ogg"), new Audio("resource/sound/vindicator_attack_2.ogg")];
		
			draw(context) {
				super.draw(context, MobVindicator.idleSprite, MobVindicator.hurtSprite);
			}
		
			sayIdle() {
				super.say(MobVindicator.idleAudios);
			}
			
			sayAttack() {
				super.say(MobVindicator.attackAudios);
			}
		
			hit(damage) {
				return super.hit(damage, MobVindicator.hurtAudios, MobVindicator.deathAudios);
			}
		}
		
		// 하트 - 체력바를 하트 형태로 표시
		class Heart {
			constructor(maxHealth, x, y, width, height) {
				this.health = maxHealth;
				this.totalHearts = maxHealth / 4;
				this.status = "";
				this.blinkTimer = 0;
				this.x = x;
				this.y = y;
				this.width = width;
				this.height = height;
				
				Heart.heartImg.src = "resource/ui/heart.png";
				Heart.heartBackgroundImg.src = "resource/ui/heart_background.png";
				Heart.heartBlinkImg.src = "resource/ui/heart_blink.png";
			}
			
			static heartImg = new Image();
			static heartBackgroundImg = new Image();
			static heartBlinkImg = new Image();
			static hurtAudios = [new Audio("resource/sound/steve_hurt.ogg")];
		}
		// 하트 그리기
		Heart.prototype.draw = function(context) {
			// 현재 상태가 attacked 이면 깜빡깜빡을 추가
			let addBlink = this.status.startsWith("attacked") && this.blinkTimer-- > 0; // blinkTimer는 깜빡임이 너무 빨리 사라지지 않도록 함
			if (!addBlink && this.status !== "") {
				this.status = this.status === "attacked3" ? "" : `attacked${parseInt(this.status[this.status.length - 1]) + 1}`;
				this.blinkTimer = 10;
			}
			
			let aliveHearts = Math.ceil(this.health / 4);
			let deadHearts = this.totalHearts - aliveHearts;
			let drawX = this.x;
			
			// 죽은 하트 그리기
			for (let i = 0; i < this.totalHearts; i++, drawX += this.width + 10) {
				context.drawImage(Heart.heartBackgroundImg, drawX, this.y, this.width, this.height);
			}
			
			// 아직 살아있는 하트 그리기
			drawX = this.x;
			for (let i = 0; i < aliveHearts; i++, drawX += this.width + 10) {
				context.drawImage(Heart.heartImg, drawX, this.y, this.width, this.height);
			}
			
			// 깜빡깜빡 그리기
			drawX = this.x;
			if (addBlink) {
				context.fillStyle = 'rgba(255, 56, 56, 0.4)';
				context.fillRect(0, 0, maxWidth, maxHeight);
				for (let i = 0; i < this.totalHearts; i++, drawX += this.width + 10) {
					context.drawImage(Heart.heartBlinkImg, drawX, this.y, this.width, this.height);
				}
			}
		}
		// 하트가 데미지를 입었을 때 깜빡임 추가, 그리고 소리 내기
		Heart.prototype.hit = function(damage) {
			this.health -= damage;
			this.health = Math.max(this.health, 0);
			this.status = "attacked1";
			this.blinkTimer = 20;
			
			let hurtAudio = Heart.hurtAudios[Math.floor(Math.random() * Heart.hurtAudios.length)];
			hurtAudio.play();
		}
		
		// 초를 '분분:초초' 문자열로 바꿔서 반환하는 함수 (180초는 03:00)
		function formatTime(secs) {
		  let minutes = Math.floor(secs / 60);
		  let seconds = secs % 60;
		  return (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
		}
		
		const self = this;
		const canvas = document.getElementById("myCanvas");
		const context = canvas.getContext("2d");
		const canvasPosition = $(canvas).position();
		
		const spawnLineWidthMin = maxWidth * 0.15; // 몹이 생성되는 x좌표 왼쪽 경계
		const spawnLineWidthMax = maxWidth * 0.85; // 몹이 생성되는 x좌표 오른쪽 경계
		const spawnLine = maxHeight * 0.2; // 몹이 생성되는 y좌표
		const deathLine = maxHeight * 0.98; // 공이 마을을 때리고 없어지는 y좌표 경계
		
		let villageHealthMax = 40; // 마을 전체 체력
		let villageHealth = villageHealthMax; // 마을 체력
		let maxSpawns = 10; // 한 화면에서 존재할 수 있는 최대 몹 개수
		let mobSpawnChance = 50; // 몹 생성 함수가 1초마다 호출될 때 몹이 실제로 생성될 확률, 0 ~ 100 사이
		let mobSpeedModifier = 1; // 몹의 속도를 얼만큼 배수할 것인지
		let remainingTime = 180; // 버티는 시간, 초단위 (180초)
		let addedTime = 0; // 시간 계산에 사용할 변수
		let bonusEXP = 300; //  끝까지 버텼을 경우 경험치 보상
		let doSpawnIllager = false; // 우민 생성 여부, 노멀 이상부터 생성됨
		let obtainedXp = 0; // 현재 스테이지에서 얻은 경험치
		let gameEnded = false; // 게임 승패 여부
		
		// 난이도에 따른 차이
		switch(currentLevel){
			case "easy": // easy는 위의 값을 그대로 따라감
				break;
			case "normal":
				maxSpawns = 14;
				mobSpawnChance = 65;
				mobSpeedModifier = 1.05;
				remainingTime = 240;
				bonusEXP = 600;
				doSpawnIllager = true;
				break;
			case "hard":
				maxSpawns = 20;
				mobSpawnChance = 80;
				mobSpeedModifier = 1.1;
				remainingTime = 300;
				bonusEXP = 1000;
				doSpawnIllager = true;
				break;
		}
		
		// 각종 배경, 사운드 이펙트, 음악
		const villageHitAudios = [new Audio("resource/sound/village_hit_1.ogg"), new Audio("resource/sound/village_hit_2.ogg"), new Audio("resource/sound/village_hit_3.ogg"), new Audio("resource/sound/village_hit_4.ogg")];
		const villageBreakAudios = [new Audio("resource/sound/village_break.ogg")];
		const mainMusic = new Audio("resource/sound/stage3_music.ogg");
		mainMusic.volume = 0.8; // 음악 볼륨
		mainMusic.play();
		const victoryMusic = new Audio("resource/sound/stage3_victory.ogg");
		const defeatMusic = new Audio("resource/sound/stage3_defeat.ogg");
		
		let backgroundImage = new Image();
		let hiddenImage = new Image(); // 배경 미리 가져와서 그리기 (캔버스에 그릴 때 깜빡임 방지)
			
		backgroundImage.src = "resource/background/stage3_background_1.png";
		let fireBackground = new Image();
		let backgroundChangeInterval = Math.floor(remainingTime / 4); // 배경을 바꾸는 주기 (예: 180초를 버텨야 한다면 45초마다 배경 바꿈)
		
		// 하트 체력바
		const heart = new Heart(villageHealthMax, maxWidth / 2 - 270, maxHeight - 40, 40, 40);
		
		// 타이머를 표시하는 div, 오른쪽 상단에 배치됨
		const timeDiv = $("<div />").attr("id", "stage3_time");
		$(timeDiv).css({
			"position": "absolute",
			"z-index": "1",
			"left": (canvasPosition.left + 590) + "px",
			"top": (canvasPosition.top + 40) + "px",
			"width": "180px",
			"height": "80px",
			"line-height": "80px",
			"border": "2px dashed white",
			"border-radius": "15px",
			"text-align": "center",
			"font": "30px bold Arial",
			"color": "white"
		});
		$(canvas).parent().append(timeDiv);
		
		// 획득 경험치를 표시하는 div, 왼쪽 상단에 배치됨
		const expDiv = $("<div />").attr("id", "stage3_exp");
		$(expDiv).css({
			"position": "absolute",
			"z-index": "1",
			"left": (canvasPosition.left + 10) + "px",
			"top": (canvasPosition.top + 30) + "px",
			"width": "180px",
			"height": "80px",
			"line-height": "80px",
			"text-align": "center",
			"font": "30px bold Arial",
			"color": "#7bf318"
		});
		expDiv.text("XP: 0");
		$(canvas).parent().append(expDiv);
		
		const volumeDiv = $("<div />").attr("id", "stage3_volume");
		let volumeOn = true;
		volumeDiv.append($("<img />").attr("src", "resource/sprite/volume_on.png").attr("width", "60px").attr("height", "60px"));
		$(volumeDiv).css({
			"position": "absolute",
			"z-index": "1",
			"height": "60px",
			"left": (canvasPosition.left + 700) + "px",
			"top": (canvasPosition.top + 710) + "px",
			"line-height": "80px",
		});
		volumeDiv.on("click", function() {
			if (volumeOn) {
				volumeOn = false;
				mainMusic.volume = 0.0;
				volumeDiv.find("img").attr("src", "resource/sprite/volume_off.png");
			}
			else {
				volumeOn = true;
				mainMusic.volume = 0.8;
				volumeDiv.find("img").attr("src", "resource/sprite/volume_on.png");
			}
		});
		$(canvas).parent().append(volumeDiv);
		
		// 현재 화면에 존재하는 모든 몹을 배열에 저장
		let activeMobs = [];
		
		// 현재 표시해야할 경험치 라벨 들을 배열에 저장
		let expLabels = [];
		
		// 몹의 생성 비중에 따라 배열의 크기 차지
		let mobSpawnWeights = [];
		let mobIndex = 0;
		[MobZombie, MobSpider, MobCreeper, MobVindicator].forEach((mob) => {
			if (mob === MobVindicator && !doSpawnIllager) {
				// 우민이 생성되지 않을 것이면 비중에 추가할 필요가 없음
			}
			else {
				for (let i = 0; i < mob.spawnWeight; i++)
					mobSpawnWeights.push(mobIndex);
				mobIndex += 1;
			}
		});
		// 몹을 생성하는 함수
		function spawnMob() {
			// 현재 화면에 존재하는 몹 개수가 최대 개수보다 많으면 리턴
			if (activeMobs.length >= maxSpawns)
				return;
			
			let randomInt = Math.floor(Math.random() * 100);
			if (randomInt <= mobSpawnChance) // 몹이 몹 생성 확률 안에 있으면 실제로 생성
			{
				// 몹이 생성되는 x 좌표
				const randomSpawnX = Math.floor(Math.random() * (spawnLineWidthMax - spawnLineWidthMin + 1)) + spawnLineWidthMin;
				let newMob; // 새로운 몹 변수
				
				// 각 몹의 생성 비중에 따라 어느 몹을 생성할 지 결정
				// 이곳에서 각 몹의 속성 변경 가능
				randomInt = Math.floor(Math.random() * mobSpawnWeights.length);
				switch(mobSpawnWeights[randomInt]) {
					case 0:
						newMob = new MobZombie(
							randomSpawnX, // 생성 좌표 x
							spawnLine, // 생성 좌표 y
							20, // maxHealth
							2, // damage
							0.15 * mobSpeedModifier, // speed
							60, // width - canvas에서의 가로 길이
							60, // height - canvas에서의 세로 길이
							10 // exp
						);
						break;
					case 1:
						newMob = new MobSpider(
							randomSpawnX,
							spawnLine,
							10,
							1,
							0.2 * mobSpeedModifier,
							90,
							66,
							12
						);
						break;
					case 2:
						newMob = new MobCreeper(
							randomSpawnX,
							spawnLine,
							16,
							4,
							0.15 * mobSpeedModifier,
							60,
							60,
							20
						);
						break;
					case 3:
						newMob = new MobVindicator(
							randomSpawnX,
							spawnLine,
							25,
							3,
							0.23 * mobSpeedModifier,
							54,
							76,
							30
						);
						break;
				}
				if (newMob != undefined)
				{
					newMob.sayIdle(); // 소리 내기
					activeMobs.push(newMob); // 화면에 존재하는 몹 배열에 추가
				}
			}
			else
				return;
		}
		// 몹을 생성하는 함수는 1초마다 실행됨
		const spawnInterval = setInterval(spawnMob, 1000);
		
		// 남은 시간을 계산하는 함수
		function updateTimer() {
			remainingTime -= 1;
			addedTime += 1;
			$(timeDiv).text("Time Left: " + formatTime(remainingTime));
			
			// 시간에 따라 배경 바꾸기
			backgroundImage.src = "resource/background/stage3_background_" + (Math.floor(addedTime / backgroundChangeInterval) + 1) + ".png";
			
			// 미리 배경화면 준비해놓기
			hiddenImage.src = "resource/background/stage3_background_" + (Math.floor(addedTime % 5) + 1) + ".png";
			
			// 배경음악 루프
			mainMusic.play();
			
			if (gameEnded) // 게임 승패가 났으면 배경음악 멈추기
				mainMusic.pause();
		}
		
		// 시간 계산은 1초마다 실행됨
		const timeCountdown = setInterval(updateTimer, 1000);
		
		// 마을 체력바를 그리는 함수 - 하트 체력바로 대체됨
		/*
		function drawVillageHealthBar(context) {
			let healthBarWidth = spawnLineWidthMax - spawnLineWidthMin;
			context.fillStyle = "#565656"; // 체력바 배경
			context.fillRect(spawnLineWidthMin, deathLine - 30, healthBarWidth, 30);
			
			context.fillStyle = "#00eb0b"; // 실제 체력 1 (연두색)
			context.fillRect(spawnLineWidthMin, deathLine - 30, healthBarWidth * (villageHealth / villageHealthMax), 30);
			
			context.fillStyle = "#00c209"; // 실제 체력 2 (초록색)
			context.fillRect(spawnLineWidthMin, deathLine - 15, healthBarWidth * (villageHealth / villageHealthMax), 15);
		} */
		
		// 공과 각종 사각형들(패들, 몹)이 충돌하는지 검사하는 함수
		function checkCollision(ball, rect, ballRad) {
			// 임시 변수를 설정하여 테스트할 가장자리 결정
			let testX = ball.x;
			let testY = ball.y;
		
			// 어느 가장자리가 가장 가까운지 결정
			if (ball.x < rect.x) {
				testX = rect.x;       // 왼쪽 가장자리 테스트
			} else if (ball.x > rect.x + rect.width) {
				testX = rect.x + rect.width;  // 오른쪽 가장자리 테스트
			}
		
			if (ball.y < rect.y) {
				testY = rect.y;       // 상단 가장자리 테스트
			} else if (ball.y > rect.y + rect.height) {
				testY = rect.y + rect.height; // 하단 가장자리 테스트
			}
		
			// 가장 가까운 가장자리로부터의 거리 구하기
			let distX = ball.x - testX;
			let distY = ball.y - testY;
			let distance = Math.sqrt((distX * distX) + (distY * distY));
		
			// 거리가 반지름보다 작거나 같다면, 충돌이 발생
			if (distance <= ball.radius) {
				if (testX === rect.x) {
					//console.log("공이 사각형의 왼쪽에서 충돌");
					return (Math.PI - ballRad);
				}
				if (testX === rect.x + rect.width) {
					//console.log("공이 사각형의 오른쪽에서 충돌");
					return (Math.PI - ballRad);
				}
				if (testY === rect.y) {
					//console.log("공이 사각형의 위에서 충돌");
					return (2 * Math.PI - ballRad); 
				}
				if (testY === rect.y + rect.height) {
					//console.log("공이 사각형의 아래에서 충돌");
					return (2 * Math.PI - ballRad); 
				}
			}
			return 999; // 충돌하지 않음
		}
		
		function randomBallRad() {
			return Math.PI * (Math.random() - 0.5) * 3 / 90; // pi * (-3/180 ~ 3/180): -3도에서 3도 랜덤 각도 
		}
		
		// 패들 크기
		const barWidth = 132;
		const barHeight = 36;
		
		// 패들 객체
		let bar = new Bar(100 + maxWidth / 2 - barWidth / 2, deathLine - 100, barWidth, barHeight);
		
		// 공 객체
		let ball = new Ball(450, 600, 10, getPlayerDamage(), 1 + 6);
		
		// 처음 시작할 때 공 라디안: -45도에서 -135도 사이 범위
		//let ballRad = Math.PI * (Math.random() * 0.6 - 1) / 2;
		let ballRad = Math.PI * (Math.random() * (-45 + 135) - 135) / 180;
		
		
		// 승리(주어진 시간 끝까지 버팀)한지 또는 패배(마을이 체력을 모두 잃어서 파괴됬는지) 검사
		function checkWinLose() {
			if (remainingTime <= 0) {
				gameEnded = true;

				return 1;
			}
			if (villageHealth <= 0) {
				villageHealth = 0;
				
				gameEnded = true;
				return -1;
			}
		}
		
		// 실제 게임 진행 루프가 이루어지는 함수
		function loop() {
			if (!self.gameOn) { // 스테이지를 중간에 나갔을 때 수행
				clearInterval(spawnInterval);
				clearInterval(timeCountdown);
				mainMusic.pause();
				self.gameEnd(context);
				return;
			}
			
			if (!gameEnded)
				requestAnimationFrame(loop);
			else { // 게임이 끝났을 때 (승패가 갈림)
				clearInterval(spawnInterval);
				clearInterval(timeCountdown);
				return;
			}
			context.clearRect(0, 0, maxWidth, maxHeight);
			
			// 몹이 아래쪽으로 움직임
			for (let i in activeMobs) {
				let mob = activeMobs[i];
				mob.y += mob.speed;
				// 몹이 마을에 도달했을 때 (아래 끝까지)
				if (mob.y > deathLine - 60) {
					let villageHitAudio = villageHitAudios[Math.floor(Math.random() * villageHitAudios.length)];
					mob.sayAttack();
					villageHitAudio.play();
					villageHealth -= mob.damage;
					heart.hit(mob.damage);
					
					activeMobs.splice(i, 1);
				}
			}
			
			// 패들이 왼쪽과 오른쪽 벽 밖으로 나가지 않도록 함
			bar.x = Math.max(
				0,
				Math.min(
					maxWidth - barWidth, 
					mousePos[0] - mousePadding - barWidth / 2
				)
			);
			
			// 공 충돌 계산
			// 양 옆 벽과 충돌
			if (ball.x < ball.radius || ball.x > maxWidth - ball.radius) {
				ballRad = Math.PI - ballRad;
				ballRad += randomBallRad();
			}
			
			// 위아래 벽과 충돌
			if (ball.y <= ball.radius || ball.y > maxHeight - ball.radius) {
				ballRad = (2 * Math.PI - ballRad);
				ballRad += randomBallRad();
			}
			
			// 패들과 충돌
			let collideWithBar = checkCollision(ball, bar, ballRad);
			if (collideWithBar != 999) { // 충돌했다면 999가 아닌 수를 반환
				bar.collideSound();
				ballRad = collideWithBar;
				ballRad += randomBallRad();
			}
			
			// 몹과 충돌
			for (let i in activeMobs) {
				let mob = activeMobs[i];
				let collideWithMob = checkCollision(ball, mob, ballRad);
				
				if (collideWithMob != 999) { // 충돌했다면 999가 아닌 수를 반환
					ballRad = collideWithMob;
					ballRad += randomBallRad();
					if (mob.hit(ball.damage)) { // 공에 맞은 몹이 죽은 경우, 경험치 라벨을 표시하고 죽은 몹을 화면에 있는 몹 배열에서 지우기
						let expLabel = new ExperienceLabel(mob.x, mob.y, mob.exp);
						expLabel.ding();
						expLabels.push(expLabel);
						obtainedXp += mob.exp;
						$(expDiv).text("XP: " + obtainedXp);
						
						activeMobs.splice(i, 1);
					}
				}
			}
			
			// 공 위치를 라디안과 속도에 따라 실제로 변화시키기
			ball.x = ball.x + Math.cos(ballRad) * ball.speed;
			ball.y = ball.y + Math.sin(ballRad) * ball.speed;
			
			// 공이 아래로 내려가서 마을을 때렸을 때 중앙으로 텔레포트
			if (ball.y > deathLine) {
				// 공 라디안 재설정
				ballRad = Math.PI * (Math.random() * (-45 + 135) - 135) / 180;
				ball.x = maxWidth * 0.5;
				ball.y = deathLine - 400;
				
				let villageHitAudio = villageHitAudios[Math.floor(Math.random() * villageHitAudios.length)];
				villageHealth -= 4;
				heart.hit(4);
			}
			
			// 캔버스에 실제로 그리는 부분
			// 배경 그리기
			context.drawImage(
				backgroundImage,
				0, // Destination x
				0, // Destination y
				maxWidth, // Destination width
				maxHeight // Destination height
			);
			
			// 마을 불 배경
			if (villageHealth < villageHealthMax) {
				let percent = (villageHealth / villageHealthMax) * 100;
				let fireIndex = 4 - Math.floor(percent / 25);
				fireBackground.src = "resource/background/stage3_background_fire_" + fireIndex + ".png";
				context.drawImage(fireBackground, 0, 0, maxWidth, maxHeight);
			}
			
			// 공 그리기
			ball.draw(context);
			
			// 패들 그리기
			bar.draw(context);
			
			// 경험치 라벨 그리기
			for (let i in expLabels) {
				let expLabel = expLabels[i];
				if (expLabel.draw(context)) // 경험치 라벨의 시간이 끝났으면 더 이상 그 라벨은 그리지 않기
					expLabels.splice(i, 1);
			}
			
			// 몹 그리기
			for (let i in activeMobs) {
				let mob = activeMobs[i];
				mob.draw(context);
			}
			
			// 승패 여부 - 0 이상이면 승리, 0 이하이면 패배
			let winLoseResult = checkWinLose();
			
			// 마을 체력바 그리기
			heart.draw(context);
			
			// 패배했을 때 처리
			if (gameEnded) {
				PlayStatus.stat.exp += obtainedXp;

				if (winLoseResult < 0) {
					let villageBreakAudio = villageBreakAudios[Math.floor(Math.random() * villageBreakAudios.length)];
					villageBreakAudio.play();
					
					mainMusic.pause(); // 배경음악 멈추기
					defeatMusic.play();
					$("#screen #stage3_time").remove();
					$("#screen #stage3_exp").remove();
					$("#screen #stage3_volume").remove();
					
					// 마을 불 배경
					context.drawImage(fireBackground, 0, 0, maxWidth, maxHeight);
					
					// 패배 배경
					context.fillStyle = 'rgba(255, 0, 0, 0.253)';
					context.fillRect(0, 0, maxWidth, maxHeight);
					
					// 패배 제목
					let font = "bold 80px Arial";
					let textColor = "white";
					context.font = font;
					context.fillStyle = textColor;
					context.fillText("Defeat!", maxWidth / 2 - 140, maxHeight * 0.15);
					
					// 경험치
					font = "bold 28px Arial";
					textColor = "#7bf318";
					context.font = font;
					context.fillStyle = textColor;
					context.fillText("Total XP: " + obtainedXp, maxWidth / 2 - 90, maxHeight * 0.35);
					
				}
				// 승리했을 때 처리
				else if (winLoseResult > 0) {
					mainMusic.pause(); // 배경음악 멈추기
					victoryMusic.play();
					$("#screen #stage3_time").remove();
					$("#screen #stage3_exp").remove();
					$("#screen #stage3_volume").remove();
					
					// 승리 배경
					context.fillStyle = 'rgba(102, 255, 0, 0.253)';
					context.fillRect(0, 0, maxWidth, maxHeight);
					
					// 승리 제목
					let font = "bold 80px Arial";
					let textColor = "white";
					context.font = font;
					context.fillStyle = textColor;
					context.fillText("Victory!", maxWidth / 2 - 140, maxHeight * 0.15);
					
					// 경험치와 보너스 경험치
					font = "bold 28px Arial";
					textColor = "#7bf318";
					context.font = font;
					context.fillStyle = textColor;
					context.fillText("Total XP: " + obtainedXp, maxWidth / 2 - 90, maxHeight * 0.35);
					
					context.fillText("Bonus XP: " + bonusEXP, maxWidth / 2 - 90, maxHeight * 0.4);
				}
			}
		}
		// requestAnimationFrame is much better than setInterval for animation and games because of optimization and synchronized with browser rendering loop
		requestAnimationFrame(loop);
	}
}
