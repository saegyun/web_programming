
$(document).ready(function() {
	let gameQuit = false;
	const reCalc = () => {
		mousePadding = ($(window).width() - $("#myCanvas").width()) / 2;
	};
	reCalc();

	$(window).on("resize", () => {
		reCalc();
	});

	// <button class="next">stage1</button>을 클릭하면 게임 시작
	$(".level-btn").on("click", function() {
		if (currentStage === "stage 5") {
			menuMusic.pause();
			moveNext(4);
			$(window).on("mousemove", event => {
				mousePos = [
					event.pageX,
					event.pageY
				];
			});
			//보스 등장 
			let img = document.createElement("img");
			img.src = "img/ender_dragon_start.gif";
			img.style.width = maxHeight + "px"
			img.style.height = maxHeight + "px";
			img.style.backgroundColor = "black";

			document.getElementById('stage5').appendChild(img);
			$("#stage5 .back").hide();//뒤로가기 버튼 잠시 숨기기

			let bossAudio = new Audio("resource/sound/dragon_growl_1.ogg");
			bossAudio.volume = monsterVolume;
			bossAudio.play();

			$("#stage5 img").fadeOut(4000, ()=>{
				img.remove();
				$("#stage5 .back").show();

				Stage5.gameOn = true; // 스테이지를 시작하면 게임이 진행 중인 것으로 취급
				Stage5.startGame($(this).val(), () => {
					$(window).off("mousemove");
				});
			});
		}
	});
	
	$("#stage5 .back").on("click", () => {
		menuMusic.play();
		Stage5.gameOn = false; // 스테이지를 나가면 게임이 끝난 것으로 취급, 아래 코드에서 루프 종료
		const canvas = document.getElementById("myCanvas");
		const context = canvas.getContext("2d");
		
		Stage5.gameEnd(context);
	});
});


// 스테이지5에 대한 총괄 함수
const Stage5 = {
	gameOn: false,
	// 게임이 승패가 갈리기 전에 스테이지를 나갔을 때 호출할 함수
	gameEnd: function(context) {
		$("#screen #stage5_volume").remove();
		setTimeout(() => {
			context.clearRect(0, 0, maxWidth, maxHeight); // canvas 지우기			
		}, 10);
		$(window).off("mousemove");
	},
	startGame: function(currentLevel, callBack) { 
		// 클래스, 함수들 정의
		// 공에 대한 클래스

		const levelInfo = {
			"easy": {
				fireSpawnChance: 40,
			},
			"normal": {
				fireSpawnChance: 60,
			},
			"hard": {
				fireSpawnChance: 80,
			}
		}
		
		class Ball {
			constructor(x, y, radius, damage, speed) {
				this.x = x;
				this.y = y;
				this.radius = radius;
				this.damage = damage; // 블럭에 대한 공격력
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
				this.status = "";
				Bar.barImage.src = "resource/sprite/paddle_steve.png";
				Bar.barHitImage.src = "resource/sprite/paddle_steve_hit.png";
				Bar.barHurtImage.src = "resource/sprite/paddle_steve_hurt.png";
				this.animationTime = 0;
			}
			static barImage = new Image();
			static barHitImage = new Image();
			static barHurtImage = new Image();
			static barCollideAudios = [new Audio("resource/sound/steve_paddle_1.ogg"), new Audio("resource/sound/steve_paddle_2.ogg"), new Audio("resource/sound/steve_paddle_3.ogg")];
		}
		
		Bar.prototype.draw = function(context) {
			let sprite;
			switch(this.status) {
				case "hit":
					if (this.animationTime >= 0) {
						this.animationTime -= 1;
						sprite = Bar.barHitImage;
					} else {
						this.status = "";
						sprite = Bar.barImage;
					}
					break;
				case "hurt":
					if (this.animationTime >= 0) {
						this.animationTime -= 1;
						sprite = Bar.barHurtImage;
					} else {
						this.status = "";
						sprite = Bar.barImage;
					}
					break;
				default:
					sprite = Bar.barImage;
					break;
			}
			
			context.drawImage(
				sprite, // Image
				this.x, // Destination x
				this.y, // Destination y
				this.width, // Destination width
				this.height // Destination height
			);
		}
		
		Bar.prototype.collideSound = function() {
			this.status = "hit";
			this.animationTime = 30;
			Bar.barCollideAudios[Math.floor(Math.random() * Bar.barCollideAudios.length)].play();
		}
		
		Bar.prototype.hurt = function() {
			this.status = "hurt";
			this.animationTime = 30;
		}
		
		// 블럭에 대한 부모 클래스
		class Object {
			constructor(x, y, maxHealth, damage, width, height, drop) {
				this.x = x;
				this.y = y;
				this.maxHealth = maxHealth;
				this.health = maxHealth;
				this.damage = damage;
				this.width = width;
				this.height = height;
				this.drop = drop;
				Object.breakSprite.src = "resource/sprite/block_destroy_stages.png";
			}
			static breakSprite = new Image();
			static breakSpriteWidth = 150;
			static breakSpriteHeight = 236;
		}
		
		// 블럭을 canvas에 그리기 위한 함수
		Object.prototype.draw = function(context, sprite) {
			context.drawImage(
				sprite, // Image
				this.x, // Destination x
				this.y, // Destination y
				this.width, // Destination width
				this.height // Destination height
			);
			// 블럭 위에 Break Sprite 그리기
			
			if (this.health < this.maxHealth) {
				let breakPercent = (this.health / this.maxHealth) * 100;
				let spriteNum = 9 - Math.floor(breakPercent / 10);
				
				context.drawImage(
					Object.breakSprite, // Image
					spriteNum * Object.breakSpriteWidth, // Source x
					0, // Source y
					Object.breakSpriteWidth, // Source width
					Object.breakSpriteHeight, // Source height
					this.x, // Destination x
					this.y, // Destination y
					this.width, // Destination width
					this.height // Destination height
				);
			}
		}
		// 블럭이 공에 맞았을 때를 위한 함수
		Object.prototype.hit = function(damage, hitAudios, deathAudios) {
			this.health -= damage;
			
			if (this.health <= 0) {
				let deathAudio = deathAudios[Math.floor(Math.random() * deathAudios.length)];
				deathAudio.play();
				
				return true;
			}
			else {
				let hitAudio = hitAudios[Math.floor(Math.random() * hitAudios.length)];
				hitAudio.play();
				
				return false;
			}
		}
		// 나무 블럭 클래스, 블럭 클래스 상속
		class EndCrystal extends Object {
			constructor(x, y, maxHealth, damage, width, height) {
				super(x, y, maxHealth, damage, width, height, "");
				EndCrystal.blockSprite.src = "img/end_crystal/0.png";
			}
			static blockSprite = new Image();
			static blockSpriteSide = new Image();
			static hitAudios = [new Audio("resource/sound/village_hit_1.ogg"), new Audio("resource/sound/village_hit_2.ogg"), new Audio("resource/sound/village_hit_3.ogg"), new Audio("resource/sound/village_hit_4.ogg")]; // 때릴 때 소리
			static deathAudios = [new Audio("resource/sound/village_break.ogg")];
			
			draw(context) { // 캔버스에 그리기, Block 클래스의 draw() 호출
				super.draw(context, EndCrystal.blockSprite);
			}
			
			hit(damage) { // 블럭이 맞았을 때 함수, hit() 함수의 결과 반환 (부숴지면 true, 아직 살아있으면 false) 
				return super.hit(damage, EndCrystal.hitAudios, EndCrystal.deathAudios);
			}
		}
		
		// 드래곤에 대한 클래스
		class EnderDragon {
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
			static idleSprite = new Image();
			static idleAudios = [];
			static hurtAudios = [new Audio("resource/sound/dragon_hurt_1.ogg"), new Audio("resource/sound/dragon_hurt_2.ogg"), new Audio("resource/sound/dragon_hurt_3.ogg"), new Audio("resource/sound/dragon_hurt_4.ogg")];
			static deathAudios = [new Audio("resource/sound/dragon_death.ogg")];
		}
		// 몹을 canvas에 그리기 위한 함수
		EnderDragon.prototype.draw = function(context) {
			EnderDragon.idleSprite.src = "resource/sprite/enderdragon_sprite.png";
			/*
			switch(this.status) { // 몹의 상태에 따라 다른 sprite 적용
				case "hurt":
					if (this.hitTimer > 0) { // 빨간색 오버레이(hurtSprite) 유지 시간
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
			}*/
			// 캔버스에 몹 sprite 그리기
			context.drawImage(
				EnderDragon.idleSprite, // Image
				this.currentFrame * this.frameWidth, // Source x
				0, // Source y
				this.frameWidth, // Source width
				this.frameHeight, // Source height
				this.x, // Destination x
				this.y, // Destination y
				this.width, // Destination width
				this.height // Destination height
			);
			if (this.animationTime >= 10) { // sprite animation이 너무 빠르게 진행되지 않도록 함
				this.currentFrame = (this.currentFrame + 1) % this.maxFrame;
				this.animationTime = 0;
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
		EnderDragon.prototype.say = function() {
			if (this.status !== "death") {
				let idleAudio = EnderDragon.idleAudios[Math.floor(Math.random() * EnderDragon.idleAudios.length)];
				idleAudio.volume = monsterVolume;
				idleAudio.play();
			}
		}
		// 몹이 공에 맞았을 때를 위한 함수
		EnderDragon.prototype.hit = function(damage) {
			this.health -= damage;
			
			if (this.health <= 0) // 몹이 체력을 다 잃고 죽었을 때 - true반환
			{
				this.status = "death"; // 몹 상태를 "death"로 변경
				let deathAudio = EnderDragon.deathAudios[Math.floor(Math.random() * EnderDragon.deathAudios.length)];
				deathAudio.volume = monsterVolume;
				deathAudio.play();
				// increase exp
				
				return true;
			}
			else // 몹이 죽지 않은 상태 (그냥 맞았을 때)
			{
				this.status = "hurt"; // 몹 상태를 "hurt"로 변경
				this.hitTimer = 20; // 20 frame 동안 draw에서 빨간색 오버레이(hurtSprite) 유지
				let hurtAudio = EnderDragon.hurtAudios[Math.floor(Math.random() * EnderDragon.hurtAudios.length)];
				hurtAudio.volume = monsterVolume;
				hurtAudio.play();
				return false;
			}
		}
		
		// 아이템에 대한 부모 클래스
		class Item {
			constructor(x, y, width, height, damage) {
				this.x = x;
				this.y = y;
				this.width = width;
				this.height = height;
				this.damage = damage;
			}
			static eatAudios = [new Audio("resource/sound/steve_hurt.ogg")];
		}
		
		// 아이템을 canvas에 그리기 위한 함수
		Item.prototype.draw = function(context, sprite) {
			context.drawImage(
				sprite, // Image
				this.x, // Destination x
				this.y, // Destination y
				this.width, // Destination width
				this.height // Destination height
			);
		}
		
		// 아이템 먹을 때 소리 내기
		Item.prototype.eat = function() {
			let eatAudio = Item.eatAudios[Math.floor(Math.random() * Item.eatAudios.length)];
			eatAudio.play();
		}
		
		// FireBall 클래스, 아이템 클래스 상속
		class FireBall extends Item {
			constructor(x, y, width, height, damage) {
				super(x, y, width, height, damage);
				FireBall.itemSprite.src = "resource/sprite/item_fire.png";
			}
			static itemSprite = new Image();
			
			draw(context) {
				super.draw(context, FireBall.itemSprite);
			}
			
			eat() {
				super.eat();
			}
		}

		// Flame 클래스, 아이템 클래스 상속
		class Flame extends Item {
			constructor(x, y, width, height, damage) {
				super(x, y, width, height, damage);
				Flame.itemSprite.src = "img/fire_5.png";
			}
			static itemSprite = new Image();
			
			draw(context) {
				super.draw(context, Flame.itemSprite);
			}
			
			eat() {
				super.eat();
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
		
		
		const spawnLineWidthMin = maxWidth * 0.05; // 스킬이 생성되는 x좌표 왼쪽 경계
		const spawnLineWidthMax = maxWidth * 0.95; // 스킬이 생성되는 x좌표 오른쪽 경계
		const spawnLineHeightMin = maxHeight * 0.3; // 스킬이 생성되는 y좌표 위쪽 경계
		const spawnLineHeightMax = maxHeight * 0.35; // 스킬이 생성되는 y좌표 아래쪽 경계
		const deathLine = maxHeight * 0.98; // 공이 생명을 줄어들게 하는 y좌표 경계
	
		let maxHealth = 40; // 생명 전체
		let currentHealth = maxHealth; // 현재 생명
		let maxFireBallSpawns = 7; // 한 화면에서 존재할 수 있는 최대 FireBall 개수
		let maxFlameSpawns = 3; // 한 화면에서 존재할 수 있는 최대 Flame 개수
		let itemSpawnChance = levelInfo[currentLevel].fireSpawnChance; // FireBall 생성 함수가 1초마다 호출될 때 몹이 실제로 생성될 확률, 0 ~ 100 사이
		
		let addedTime = 0; // 걸린 시간을 측정하는 변수
		let gameEnded = false; // 게임 승패 여부
		let victory = false;
		
		// 각종 배경, 사운드 이펙트, 음악
		const mainMusic = new Audio("resource/sound/stage5_music.ogg");
		mainMusic.volume = 1.0; // 음악 볼륨
		mainMusic.play();
		const victoryMusic = new Audio("resource/sound/stage2_victory.ogg");
		const defeatMusic = new Audio("resource/sound/stage3_defeat.ogg");
		const steveDeathAudio = new Audio("resource/sound/steve_hurt.ogg");
		const popAudio = new Audio("resource/sound/item_pop.ogg");
		const ballFallAudio = new Audio("resource/sound/tool_break.ogg");
		const growlAudios = [new Audio("resource/sound/dragon_growl_1.ogg"), new Audio("resource/sound/dragon_growl_2.ogg"), new Audio("resource/sound/dragon_growl_3.ogg"), new Audio("resource/sound/dragon_growl_4.ogg")];
		
		
		let backgroundImage = new Image();
			
		backgroundImage.src = "resource/background/stage5_background.png";
		
		// 허기바
		const heart = new Heart(maxHealth, maxWidth / 2 - 270, maxHeight - 40, 40, 40);

		
		// 볼륨 버튼을 표시하는 div, 오른쪽 하단에 표시됨
		const volumeDiv = $("<div />").attr("id", "stage5_volume");
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
				mainMusic.volume = 1.0;
				volumeDiv.find("img").attr("src", "resource/sprite/volume_on.png");
			}
		});
		$(canvas).parent().append(volumeDiv);
		
		
		// 현재 화면에 존재하는 모든 블럭을 배열에 저장
		let activeBlocks = [];
		
		// 현재 화면에 존재하는 모든 FireBall을 배열에 저장
		let activeFireBallItems = [];

		// 현재 화면에 존재하는 모든 Flame 배열에 저장
		let activeWarningItems = [];
		let activeFlameItems = [];
		
		activeBlocks.push(new EndCrystal(maxWidth * 0.8, maxHeight * 0.5, 10, 0, 150, 236));
		activeBlocks.push(new EndCrystal(maxWidth * 0.01, maxHeight * 0.5, 10, 0, 150, 236));
		
		let dragon = new EnderDragon(
			maxWidth * 0.34,
			maxHeight * 0.1,
			100, // health
			0,
			0,
			300,
			306,
			5, // maxFrame
			400, // frameWidth
			408, // frameHeight
			100 // exp
		);
		
		// FireBall을 생성하는 함수
		function spawnFire() {
			// 현재 화면에 존재하는 몹 개수가 최대 개수보다 많으면 리턴
			if (activeFireBallItems.length >= maxFireBallSpawns)
				return;
			
			let randomInt = Math.floor(Math.random() * 100);
			if (randomInt <= itemSpawnChance) // 몹이 몹 생성 확률 안에 있으면 실제로 생성
			{
				// 몹이 생성되는 x 좌표
				const randomSpawnX = Math.floor(Math.random() * (spawnLineWidthMax - spawnLineWidthMin + 1)) + spawnLineWidthMin;
				const randomSpawnY = Math.floor(Math.random() * (spawnLineHeightMax - spawnLineHeightMin + 1)) + spawnLineHeightMin;
				let newItem; // 새로운 몹 변수
				
				// 각 몹의 생성 비중에 따라 어느 몹을 생성할 지 결정
				// 이곳에서 각 몹의 속성 변경 가능
				
				newItem = new FireBall(randomSpawnX, randomSpawnY, 40, 40, 0);
				
				activeFireBallItems.push(newItem);
				
				let growlAudio = growlAudios[Math.floor(Math.random() * growlAudios.length)];
				growlAudio.volume = monsterVolume;
				growlAudio.play();
			}
			else
				return;
		}
		// FireBall을 생성하는 함수는 2초마다 실행됨
		const spawnFireBallInterval = setInterval(spawnFire, 2000);

		// Flame 생성하는 함수
		function spawnFlame() {
			activeFlameItems = [];
			for(let i in activeWarningItems){ //경고했던 Flame 실제로 생성
				let item = activeWarningItems[i];
				activeFlameItems.push(item);
			}
			activeWarningItems = [];
			for(let i = 0; i < maxFlameSpawns; i ++){
				let randomInt = Math.floor(Math.random() * 100);
				if (randomInt <= itemSpawnChance) // 몹이 몹 생성 확률 안에 있으면 실제로 생성
				{
					// 몹이 생성되는 x 좌표
					const randomSpawnX = Math.floor(Math.random() * (spawnLineWidthMax*0.95 - spawnLineWidthMin + 1)) + spawnLineWidthMin;
					const randomSpawnY = deathLine - 150;
					let newItem; // 새로운 몹 변수
				
					newItem = new Flame(randomSpawnX, randomSpawnY, 100, 100, 0);
				
					activeWarningItems.push(newItem);
				
					let growlAudio = growlAudios[Math.floor(Math.random() * growlAudios.length)];
					growlAudio.volume = monsterVolume;
					growlAudio.play();
				}
				else
					return;
			}
		}
		// Flame을 생성하는 함수는 4초마다 실행됨
		const spawnFlameInterval = setInterval(spawnFlame, 4000);

		//Explosion을 생성하는 함수
		function Explosion(){
			let explosionImg = document.createElement("img");
			explosionImg.src = "img/explosion.gif";
			explosionImg.style.position = "absolute";
			explosionImg.style.width = maxWidth + "px";
			explosionImg.style.height = maxHeight + "px";
			explosionImg.style.left = "100px";
			explosionImg.style.zIndex = "2";
			explosionImg.style.opacity = "0.7";

			document.getElementById('stage5').appendChild(explosionImg);

			//반드시 플레이어의 생명력 1 닳음
			currentHealth = Math.max(currentHealth - 4, 0);
			heart.hit(4);

			let exlAudio = new Audio("resource/sound/explosion.ogg");
			exlAudio.volume = monsterVolume;
			exlAudio.play();

			bar.hurt();

			setTimeout(()=>{
				explosionImg.remove();
			}, 1000);
		}
		// Explosion을 생성하는 함수는 20초마다 실행됨
		const spawnExplosionInterval = setInterval(Explosion, 20000);
		
		// 시간을 계산하는 함수
		function updateTimer() {
			addedTime += 1;
			
			// 배경음악 루프
			mainMusic.play();
			
			if (gameEnded) // 게임 승패가 났으면 배경음악 멈추기
				mainMusic.pause();
		}
		
		// 시간 계산은 1초마다 실행됨
		const timeCountdown = setInterval(updateTimer, 1000);
		
		// 공과 각종 사각형들(패들, 동물, 블럭)이 충돌하는지 검사하는 함수
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
		// 사각형(패들과 각종 사각형들(음식)이 충돌하는지 검사하는 함수
		function checkRectCollision(rect1, rect2) {
			if (rect1.x < rect2.x + rect2.width && 
				rect1.x + rect1.width > rect2.x && 
				rect1.y < rect2.y + rect2.height && 
				rect1.y + rect1.height > rect2.y) {
		
				return true;
			}
			return false;
		}
		
		function randomBallRad() {
			return Math.PI * (Math.random() - 0.5) * 3 / 90; // pi * (-3/180 ~ 3/180): -3도에서 3도 랜덤 각도 
		}
		
		// 패들 크기
		const barWidth = 105;
		const barHeight = 114;
		
		// 패들 객체
		let bar = new Bar(100 + maxWidth / 2 - barWidth / 2, deathLine - 150, barWidth, barHeight);
	
		// 공 객체
		let ball = new Ball(450, 600, 10, getPlayerDamage(), 1 + 6);
		
		// 처음 시작할 때 공 라디안: -45도에서 -135도 사이 범위
		let ballRad = Math.PI * (Math.random() * (-45 + 135) - 135) / 180;
		
		
		// 승리(나무를 모두 캠)한지 또는 패배(허기가 0) 검사
		function checkWinLose() {
			if (victory) {
				gameEnded = true;
				return 1;
			}
			if (currentHealth <= 0) {
				currentHealth = 0;
				
				gameEnded = true;
				return -1;
			}
		}
		
		// 실제 게임 진행 루프가 이루어지는 함수
		function loop() {
			if (!self.gameOn) { // 스테이지를 중간에 나갔을 때 수행
				clearInterval(spawnFireBallInterval);
				clearInterval(spawnFlameInterval);
				clearInterval(timeCountdown);
				clearInterval(spawnExplosionInterval);

				mainMusic.pause();
				self.gameEnd(context);
				return;
			}
			
			if (!gameEnded)
				requestAnimationFrame(loop);
			else { // 게임이 끝났을 때 (승패가 갈림)
				clearInterval(spawnFireBallInterval);
				clearInterval(spawnFlameInterval);
				clearInterval(timeCountdown);
				clearInterval(spawnExplosionInterval);
				return;
			}
			context.clearRect(0, 0, maxWidth, maxHeight);
			
			
			// FireBall이 아래로 떨어짐
			for (let i in activeFireBallItems) {
				let item = activeFireBallItems[i];
				item.y += 0.8; // food.y + speed
				// FireBall이 먹히지 않고 땅으로 떨어짐
				if (item.y + item.height >= maxHeight) {
					popAudio.play();
					activeFireBallItems.splice(i, 1);
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
			
			// 블럭과 충돌
			for (let i in activeBlocks) {
				let block = activeBlocks[i];
				let collideWithBlock = checkCollision(ball, block, ballRad);
				
				if (collideWithBlock != 999) { // 충돌했다면 999가 아닌 수를 반환
					ballRad = collideWithBlock;
					ballRad += randomBallRad();
					
					if (block.hit(ball.damage)) { // 공에 맞은 블럭이 부숴진 경우, 음식 드롭
						activeBlocks.splice(i, 1);
					}
				}
			}
			
			// 드래곤과 충돌
			let collideWithDragon = checkCollision(ball, dragon, ballRad);
			if (collideWithDragon != 999) { // 충돌했다면 999가 아닌 수를 반환
				ballRad = collideWithDragon;
				ballRad += randomBallRad();
				
				if(activeBlocks.length <= 0) {
					if (dragon.hit(ball.damage)) { // 공에 맞은 블럭이 부숴진 경우, 음식 드롭
						victory = true;
					}
				}
			}
			
			// 패들과 FireBall이 충돌
			for (let i in activeFireBallItems) {
				let item = activeFireBallItems[i];
				let collideWithItem = checkRectCollision(bar, item);
				
				if (collideWithItem) { // 충돌했다면 true
					currentHealth = Math.max(currentHealth - 4, 0);
					heart.hit(4);
					item.eat();
					bar.hurt();
					
					activeFireBallItems.splice(i, 1);
				}
			}
			
			// 패들과 Flame 충돌
			for (let i in activeFlameItems) {
				let item = activeFlameItems[i];
				let collideWithItem = checkRectCollision(bar, item);
				
				if (collideWithItem) { // 충돌했다면 true
					currentHealth = Math.max(currentHealth - 4, 0);
					heart.hit(4);
					item.eat();
					bar.hurt();
					
					activeFlameItems.splice(i, 1);
				}
			}

			// 공 위치를 라디안과 속도에 따라 실제로 변화시키기
			ball.x = ball.x + Math.cos(ballRad) * ball.speed;
			ball.y = ball.y + Math.sin(ballRad) * ball.speed;
			
			// 공이 아래로 내려갔을 때 중앙으로 텔레포트
			if (ball.y > deathLine) {
				// 공 라디안 재설정
				ballRad = Math.PI * (Math.random() * (-45 + 135) - 135) / 180;
				ball.x = maxWidth * 0.5;
				ball.y = deathLine - 200;
				
				ballFallAudio.play();
				currentHealth = Math.max(currentHealth - 4, 0);
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
			
			// 공 그리기
			ball.draw(context);
			
			// 패들 그리기
			bar.draw(context);
			
			// 블럭 그리기
			for (let i in activeBlocks) {
				let block = activeBlocks[i];
				block.draw(context);
			}
			
			if(dragon.health >= 0)
				dragon.draw(context);
			
			// 스킬 그리기
			for (let i in activeFireBallItems) {
				let item = activeFireBallItems[i];
				item.draw(context);
			}
			// Flame 경고지대
			for (let i in activeWarningItems) {
				let item = activeWarningItems[i];

				context.fillStyle = 'rgba(255, 0, 0, 0.253)';
				context.fillRect(item.x, 0, item.width, maxHeight);
			}
			//Flame 그리기
			for (let i in activeFlameItems) {
				let item = activeFlameItems[i];
				item.draw(context);
			}
			
			// 승패 여부 - 0 이상이면 승리, 0 이하이면 패배
			let winLoseResult = checkWinLose();
			
			// 마을 체력바 그리기
			heart.draw(context);
			
			// 패배했을 때 처리
			if (gameEnded && winLoseResult < 0)
			{
				steveDeathAudio.play();
				
				mainMusic.pause(); // 배경음악 멈추기
				defeatMusic.play();
				$("#screen #stage5_volume").remove();
				
				// 패배 배경
				context.fillStyle = 'rgba(255, 0, 0, 0.253)';
				context.fillRect(0, 0, maxWidth, maxHeight);
				
				// 패배 제목
				let font = "bold 80px Arial";
				let textColor = "white";
				context.font = font;
				context.fillStyle = textColor;
				context.fillText("You Died!", maxWidth / 2 - 165, maxHeight * 0.15);
				
				// 경험치
				font = "bold 32px Arial";
				context.font = font;
				context.fillText("Steve went up in flames", maxWidth / 2 - 160, maxHeight * 0.25);
				
			}
			// 승리했을 때 처리
			else if (gameEnded && winLoseResult > 0)
			{
				mainMusic.pause(); // 배경음악 멈추기
				victoryMusic.play();
				$("#screen #stage5_volume").remove();
				
				// 승리 배경
				context.fillStyle = 'rgba(102, 255, 0, 0.253)';
				context.fillRect(0, 0, maxWidth, maxHeight);
				
				// 승리 제목
				let font = "bold 80px Arial";
				let textColor = "white";
				context.font = font;
				context.fillStyle = textColor;
				context.fillText("Victory!", maxWidth / 2 - 140, maxHeight * 0.15);
				
				// 시간
				font = "bold 32px Arial";
				context.font = font;
				context.fillText("Time: " + formatTime(addedTime), maxWidth / 2 - 80, maxHeight * 0.35);
				
			}
		}
		
		// requestAnimationFrame is much better than setInterval for animation and games because of optimization and synchronized with browser rendering loop
		requestAnimationFrame(loop);
	}
}
