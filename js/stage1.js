
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
		if (currentStage === "stage 1") {
			menuMusic.pause();
			moveNext(0);
			$(window).on("mousemove", event => {
				mousePos = [
					event.pageX,
					event.pageY
				];
			});
			Stage1.gameOn = true; // 스테이지를 시작하면 게임이 진행 중인 것으로 취급
			Stage1.startGame($(this).val(), () => {
				$(window).off("mousemove");
			});
		}
	});
	
	$("#stage1 .back").on("click", () => {
		menuMusic.play();
		Stage1.gameOn = false; // 스테이지를 나가면 게임이 끝난 것으로 취급, 아래 코드에서 루프 종료
		const canvas = document.getElementById("myCanvas");
		const context = canvas.getContext("2d");
		
		Stage1.gameEnd(context);
	});
});


// 스테이지1에 대한 총괄 함수
const Stage1 = {
	gameOn: false,
	// 게임이 승패가 갈리기 전에 스테이지를 나갔을 때 호출할 함수
	gameEnd: function(context) {
		$("#screen #stage1_remainingWood").remove();
		$("#screen #stage1_volume").remove();
		setTimeout(() => {
			context.clearRect(0, 0, maxWidth, maxHeight); // canvas 지우기			
		}, 10);
		$(window).off("mousemove");
	},
	startGame: function(currentLevel, callBack) { 
		// 클래스, 함수들 정의
		// 공에 대한 클래스
		
		class Ball {
			constructor(x, y, radius, damage, speed) {
				this.x = x;
				this.y = y;
				this.radius = radius;
				this.damage = damage; // 블럭에 대한 공격력
				this.speed = speed;
				Ball.ballImage.src = "resource/sprite/ball_stone.png"; // 임시 공 텍스쳐
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
				Bar.barEatImage.src = "resource/sprite/paddle_steve_eat.png";
				this.animationTime = 0;
			}
			static barImage = new Image();
			static barHitImage = new Image();
			static barEatImage = new Image();
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
				case "eat":
					if (this.animationTime >= 0) {
						this.animationTime -= 1;
						sprite = Bar.barEatImage;
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
		
		Bar.prototype.eat = function() {
			this.status = "eat";
			this.animationTime = 30;
		}
		
		// 블럭에 대한 부모 클래스
		class Block {
			constructor(x, y, maxHealth, hungerDamage, width, height, drop) {
				this.x = x;
				this.y = y;
				this.maxHealth = maxHealth;
				this.health = maxHealth;
				this.hungerDamage = hungerDamage;
				this.width = width;
				this.height = height;
				this.drop = drop;
				Block.breakSprite.src = "resource/sprite/block_destroy_stages.png";
			}
			static breakSprite = new Image();
			static breakSpriteWidth = 80;
			static breakSpriteHeight = 80;
		}
		
		// 블럭을 canvas에 그리기 위한 함수
		Block.prototype.draw = function(context, sprite) {
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
					Block.breakSprite, // Image
					spriteNum * Block.breakSpriteWidth, // Source x
					0, // Source y
					Block.breakSpriteWidth, // Source width
					Block.breakSpriteHeight, // Source height
					this.x, // Destination x
					this.y, // Destination y
					this.width, // Destination width
					this.height // Destination height
				);
			}
		}
		// 블럭이 공에 맞았을 때를 위한 함수
		Block.prototype.hit = function(damage, hitAudios, deathAudios) {
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
		class BlockLog extends Block {
			constructor(x, y, maxHealth, hungerDamage, width, height, side) {
				super(x, y, maxHealth, hungerDamage, width, height, "");
				this.side = side;
				BlockLog.blockSprite.src = "resource/sprite/oak_log.png";
				BlockLog.blockSpriteSide.src = "resource/sprite/oak_log_side.png";
			}
			static blockSprite = new Image();
			static blockSpriteSide = new Image();
			static hitAudios = [new Audio("resource/sound/village_hit_1.ogg"), new Audio("resource/sound/village_hit_2.ogg"), new Audio("resource/sound/village_hit_3.ogg"), new Audio("resource/sound/village_hit_4.ogg")]; // 때릴 때 소리
			static deathAudios = [new Audio("resource/sound/village_break.ogg")];
			
			draw(context) { // 캔버스에 그리기, Block 클래스의 draw() 호출
				if (this.side) // 옆 또는 위쪽 나무 모양인지에 따라 달라짐
					super.draw(context, BlockLog.blockSpriteSide);
				else
					super.draw(context, BlockLog.blockSprite);
			}
			
			hit(damage) { // 블럭이 맞았을 때 함수, hit() 함수의 결과 반환 (부숴지면 true, 아직 살아있으면 false) 
				return super.hit(damage, BlockLog.hitAudios, BlockLog.deathAudios);
			}
		}
		
		// 잎 블럭 클래스, 블럭 클래스 상속
		class BlockLeaves extends Block {
			constructor(x, y, maxHealth, hungerDamage, width, height) {
				super(x, y, maxHealth, hungerDamage, width, height, "apple");
				BlockLeaves.blockSprite.src = "resource/sprite/oak_leaves.png";
			}
			static blockSprite = new Image();
			static hitAudios = [new Audio("resource/sound/leaves_dig_1.ogg"), new Audio("resource/sound/leaves_dig_2.ogg"), new Audio("resource/sound/leaves_dig_3.ogg"), new Audio("resource/sound/leaves_dig_4.ogg")];
			
			draw(context) {
				super.draw(context, BlockLeaves.blockSprite);
			}
			
			hit(damage) { 
				return super.hit(damage, BlockLeaves.hitAudios, BlockLeaves.hitAudios);
			}
		}
		
		// 동물에 대한 부모 클래스
		class Animal {
			constructor(x, y, maxHealth, hungerDamage, speed, width, height, maxFrame, frameWidth, frameHeight, drop) {
				this.x = x;
				this.y = y;
				this.maxHealth = maxHealth; // 동물 전체 체력
				this.health = maxHealth; // 동물 실제 체력
				this.hungerDamage = hungerDamage; // 동물을 때렸을 때 허기 감소 정도
				this.speed = speed; // 동물이 왕복하는 속도
				this.width = width;
				this.height = height;
				this.status = ""; // 동물 현재 상태 - "hurt"면 최근에 맞은 상태, "death"면 죽은 상태, ""이면 기본 상태
				this.hitTimer = 0; // 동물이 맞았을 때 빨간색 오버레이(hurtSprite) 유지 시간
				this.currentFrame = 0; // sprite animation에서 현재 프레임
				this.animationTime = 0; // sprite animation을 너무 빠르게 진행시키지 않기 위한 변수
				this.maxFrame = maxFrame; // sprite animation의 sprite개수
				this.frameWidth = frameWidth; // sprite 1개의 가로 길이
				this.frameHeight = frameHeight; // sprite 1개의 세로 길이
				this.drop = drop;
			}
		}
		
		// 동물을 canvas에 그리기 위한 함수
		Animal.prototype.draw = function(context, idleSprite, hurtSprite) {
			let sprite;
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
			}
			//context.fillRect(this.x, this.y, this.width, this.height); // Hitbox 체크를 위한 디버그 함수
			let sourceY = 0; // 동물이 오른쪽 방향이면 0(위쪽 sprite), 왼쪽 방향이면 1(아래쪽 sprite)
			if (this.speed < 0)
				sourceY = this.frameHeight;
				
			// 캔버스에 몹 sprite 그리기
			context.drawImage(
				sprite, // Image
				this.currentFrame * this.frameWidth, // Source x
				sourceY, // Source y
				this.frameWidth, // Source width
				this.frameHeight, // Source height
				this.x, // Destination x
				this.y, // Destination y
				this.width, // Destination width
				this.height // Destination height
			);
			if (this.animationTime >= 10) { // sprite animation이 너무 빠르게 진행되지 않도록 함
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
		// 동물 소리내기
		Animal.prototype.say = function(idleAudios) {
			if (this.status !== "death") {
				let idleAudio = idleAudios[Math.floor(Math.random() * idleAudios.length)];
				idleAudio.play();
			}
		}
		// 동물이 공에 맞았을 때를 위한 함수
		Animal.prototype.hit = function(damage, hurtAudios, deathAudios) {
			this.health -= damage;
			
			if (this.health <= 0) // 동물이 체력을 다 잃고 죽었을 때 - true반환
			{
				this.status = "death"; // 상태를 "death"로 변경
				let deathAudio = deathAudios[Math.floor(Math.random() * deathAudios.length)];
				deathAudio.play();
				
				return true;
			}
			else // 몹이 죽지 않은 상태 (그냥 맞았을 때)
			{
				this.status = "hurt"; // 상태를 "hurt"로 변경
				this.hitTimer = 20; // 20 frame 동안 draw에서 빨간색 오버레이(hurtSprite) 유지
				let hurtAudio = hurtAudios[Math.floor(Math.random() * hurtAudios.length)];
				hurtAudio.play();
				return false;
			}
		}
		
		// 돼지 클래스, 동물 클래스 상속
		class AnimalPig extends Animal {
			constructor(x, y, maxHealth, hungerDamage, speed, width, height) {
				super(x, y, maxHealth, hungerDamage, speed, width, height, 8, 370, 260, "porkchop"); // Animal 클래스의 생성자 호출
				AnimalPig.idleSprite.src = "resource/sprite/pig_idle.png"; // 걷는 sprite
				AnimalPig.hurtSprite.src = "resource/sprite/pig_hurt.png"; // 맞았을 때 sprite
			}
			static spawnWeight = 5; // 생성 비중, 아래 spawnAnimal()함수에서 설명
			static idleSprite = new Image(); 
			static hurtSprite = new Image();
			static idleAudios = [new Audio("resource/sound/pig_idle_1.ogg"), new Audio("resource/sound/pig_idle_2.ogg"), new Audio("resource/sound/pig_idle_3.ogg")]; // 생성될 때 소리
			static deathAudios = [new Audio("resource/sound/pig_death.ogg")]; // 죽었을 때 소리
		
			draw(context) { // 캔버스에 그리기, Animal 클래스의 draw() 호출
				super.draw(context, AnimalPig.idleSprite, AnimalPig.hurtSprite);
			}
		
			sayIdle() { // 생성할 때 소리 내기
				super.say(AnimalPig.idleAudios);
			}
		
			hit(damage) { // 동물이 맞았을 때 함수, hit() 함수의 결과 반환 (죽으면 true, 아직 살아있으면 false) 
				return super.hit(damage, AnimalPig.idleAudios, AnimalPig.deathAudios);
			}
		}
		
		// 소 클래스, 동물 클래스 상속
		class AnimalCow extends Animal {
			constructor(x, y, maxHealth, hungerDamage, speed, width, height) {
				super(x, y, maxHealth, hungerDamage, speed, width, height, 8, 420, 380, "beef");
				AnimalCow.idleSprite.src = "resource/sprite/cow_idle.png";
				AnimalCow.hurtSprite.src = "resource/sprite/cow_hurt.png";
			}
			static spawnWeight = 5;
			static idleSprite = new Image(); 
			static hurtSprite = new Image();
			static idleAudios = [new Audio("resource/sound/cow_idle_1.ogg"), new Audio("resource/sound/cow_idle_2.ogg"), new Audio("resource/sound/cow_idle_3.ogg"), new Audio("resource/sound/cow_idle_4.ogg")];
			static hurtAudios = [new Audio("resource/sound/cow_hurt_1.ogg"), new Audio("resource/sound/cow_hurt_2.ogg"), new Audio("resource/sound/cow_hurt_3.ogg")];
		
			draw(context) {
				super.draw(context, AnimalCow.idleSprite, AnimalCow.hurtSprite);
			}
		
			sayIdle() {
				super.say(AnimalCow.idleAudios);
			}
		
			hit(damage) { 
				return super.hit(damage, AnimalCow.hurtAudios, AnimalCow.hurtAudios);
			}
		}
		
		// 음식에 대한 부모 클래스
		class Food {
			constructor(x, y, width, height, saturation) {
				this.x = x;
				this.y = y;
				this.width = width;
				this.height = height;
				this.saturation = saturation;
			}
			static eatAudios = [new Audio("resource/sound/food_eat.ogg")];
		}
		
		// 음식을 canvas에 그리기 위한 함수
		Food.prototype.draw = function(context, sprite) {
			context.drawImage(
				sprite, // Image
				this.x, // Destination x
				this.y, // Destination y
				this.width, // Destination width
				this.height // Destination height
			);
		}
		
		// 음식 먹을 때 소리 내기
		Food.prototype.eat = function() {
			let eatAudio = Food.eatAudios[Math.floor(Math.random() * Food.eatAudios.length)];
			eatAudio.play();
		}
		
		// 사과 클래스, 음식 클래스 상속
		class FoodApple extends Food {
			constructor(x, y, width, height, saturation) {
				super(x, y, width, height, saturation);
				FoodApple.itemSprite.src = "resource/sprite/item_apple.png";
			}
			static itemSprite = new Image();
			
			draw(context) {
				super.draw(context, FoodApple.itemSprite);
			}
			
			eat() {
				super.eat();
			}
		}
		
		// 돼지고기 클래스, 음식 클래스 상속
		class FoodPorkchop extends Food {
			constructor(x, y, width, height, saturation) {
				super(x, y, width, height, saturation);
				FoodPorkchop.itemSprite.src = "resource/sprite/item_porkchop.png";
			}
			static itemSprite = new Image();
			
			draw(context) {
				super.draw(context, FoodPorkchop.itemSprite);
			}
			
			eat() {
				super.eat();
			}
		}
		
		// 소고기 클래스, 음식 클래스 상속
		class FoodBeef extends Food {
			constructor(x, y, width, height, saturation) {
				super(x, y, width, height, saturation);
				FoodBeef.itemSprite.src = "resource/sprite/item_beef.png";
			}
			static itemSprite = new Image();
			
			draw(context) {
				super.draw(context, FoodBeef.itemSprite);
			}
			
			eat() {
				super.eat();
			}
		}
		
		// 허기 - 허기바 형태로 표시
		class Hunger {
			constructor(maxHunger, x, y, width, height) {
				this.hunger = maxHunger;
				this.totalHungerIcons = maxHunger / 4;
				this.status = "";
				this.blinkTimer = 0;
				this.x = x;
				this.y = y;
				this.width = width;
				this.height = height;
				
				Hunger.hungerImg.src = "resource/ui/hunger.png";
				Hunger.hungerBackgroundImg.src = "resource/ui/hunger_background.png";
				Hunger.hungerBlinkImg.src = "resource/ui/hunger_blink.png";
			}
			
			static hungerImg = new Image();
			static hungerBackgroundImg = new Image();
			static hungerBlinkImg = new Image();
		}
		// 허기 그리기
		Hunger.prototype.draw = function(context) {
			// 현재 상태가 attacked 이면 깜빡깜빡을 추가
			let addBlink = this.status.startsWith("changed") && this.blinkTimer-- > 0; // blinkTimer는 깜빡임이 너무 빨리 사라지지 않도록 함
			if (!addBlink && this.status !== "") {
				this.status = this.status === "changed3" ? "" : `changed${parseInt(this.status[this.status.length - 1]) + 1}`;
				this.blinkTimer = 10;
			}
			
			let aliveHungers = Math.ceil(this.hunger / 4);
			let drawX = this.x;
			
			// 죽은 허기 그리기
			for (let i = 0; i < this.totalHungerIcons; i++, drawX += this.width + 10) {
				context.drawImage(Hunger.hungerBackgroundImg, drawX, this.y, this.width, this.height);
			}
			
			// 아직 살아있는 허기 그리기
			drawX = this.x;
			for (let i = 0; i < aliveHungers; i++, drawX += this.width + 10) {
				context.drawImage(Hunger.hungerImg, drawX, this.y, this.width, this.height);
			}
			
			// 깜빡깜빡 그리기
			drawX = this.x;
			if (addBlink) {
				for (let i = 0; i < this.totalHungerIcons; i++, drawX += this.width + 10) {
					context.drawImage(Hunger.hungerBlinkImg, drawX, this.y, this.width, this.height);
				}
			}
		}
		
		// 허기가 줄어들거나 늘어날 때 깜빡임 추가
		Hunger.prototype.modify = function(modifiedHunger) {
			this.hunger = modifiedHunger;
			this.status = "changed1";
			this.blinkTimer = 20;
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
		
		// 블럭 지도, 10 x 10 사이즈
		// "0"은 빈 공간, "w"는 나무, "s"는 나무 눕힘, "l"은 잎 
		const map = [
			["s","l","l","s","l","l","s","l","l","l"],
			["s","w","s","l","l","l","l","s","l","s"],
			["l","w","l","l","0","0","l","s","w","s"],
			["l","w","l","0","0","0","l","l","w","l"],
			["0","w","0","0","0","0","0","l","w","l"],
			["0","w","0","0","0","0","0","0","w","0"],
			["0","w","0","0","0","0","0","0","w","0"],
			["0","0","0","0","0","0","0","0","w","0"],
			["0","0","0","0","0","0","0","0","0","0"],
			["0","0","0","0","0","0","0","0","0","0"]
		];
		
		const spawnLineWidthMin = maxWidth * 0.15; // 동물이 생성되는 x좌표 왼쪽 경계
		const spawnLineWidthMax = maxWidth * 0.85; // 동물이 생성되는 x좌표 오른쪽 경계
		const spawnLineHeightMin = maxHeight * 0.55; // 동물이 생성되는 y좌표 위쪽 경계
		const spawnLineHeightMax = maxHeight * 0.6; // 동물이 생성되는 y좌표 아래쪽 경계
		const deathLine = maxHeight * 0.98; // 공이 허기를 줄어들게 하는 y좌표 경계
	
		let maxHunger = 40; // 허기 전체
		let currentHunger = maxHunger; // 현재 허기
		let maxSpawns = 5; // 한 화면에서 존재할 수 있는 최대 동물 개수
		let animalSpawnChance = 20; // 동물 생성 함수가 1초마다 호출될 때 몹이 실제로 생성될 확률, 0 ~ 100 사이
		let remainingWoods = 0; // 남아있는 나무 개수
		let addedTime = 0; // 걸린 시간을 측정하는 변수
		let gameEnded = false; // 게임 승패 여부
		
		// 각종 배경, 사운드 이펙트, 음악
		const mainMusic = new Audio("resource/sound/stage1_music.ogg");
		mainMusic.volume = 1.0; // 음악 볼륨
		mainMusic.play();
		const victoryMusic = new Audio("resource/sound/stage3_victory.ogg");
		const defeatMusic = new Audio("resource/sound/stage3_defeat.ogg");
		const steveDeathAudio = new Audio("resource/sound/steve_hurt.ogg");
		const popAudio = new Audio("resource/sound/item_pop.ogg");
		const ballFallAudio = new Audio("resource/sound/tool_break.ogg");
		
		
		let backgroundImage = new Image();
			
		backgroundImage.src = "resource/background/stage1_background.png";
		
		// 허기바
		const hunger = new Hunger(maxHunger, maxWidth / 2 - 270, maxHeight - 40, 40, 40);
		
		// 남아있는 나무 개수를 표시하는 div, 왼쪽 상단에 배치됨
		const remainingWoodDiv = $("<div />").attr("id", "stage1_remainingWood");
		$(remainingWoodDiv).css({
			"position": "absolute",
			"z-index": "1",
			"left": (canvasPosition.left + 30) + "px",
			"top": (canvasPosition.top + 30) + "px",
			"width": "180px",
			"height": "80px",
			"line-height": "80px",
			"text-align": "center",
			"font": "30px bold Arial",
			"color": "white"
		});
		remainingWoodDiv.text("Wood Remaining: 0");
		$(canvas).parent().append(remainingWoodDiv);
		
		// 볼륨 버튼을 표시하는 div, 오른쪽 하단에 표시됨
		const volumeDiv = $("<div />").attr("id", "stage1_volume");
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
		
		// 현재 화면에 존재하는 모든 동물을 배열에 저장
		let activeAnimals = [];
		
		// 현재 화면에 존재하는 모든 블럭을 배열에 저장
		let activeBlocks = [];
		
		// 현재 화면에 존재하는 모든 음식을 배열에 저장
		let activeFoods = [];
		
		// 블럭을 배열에 추가
		let tempX = 0;
		let tempY = 0;
		for (let i = 0; i < map.length; i++) {
			tempX = 0;
			for (let j = 0; j < map[i].length; j++) {
				switch(map[i][j]) {
					case "w":
						activeBlocks.push(new BlockLog(tempX, tempY, 11, 2, 80, 80, false));
						remainingWoods += 1;
						break;
					case "s":
						activeBlocks.push(new BlockLog(tempX, tempY, 11, 2, 80, 80, true));
						remainingWoods += 1;
						break;
					case "l":
						activeBlocks.push(new BlockLeaves(tempX, tempY, 7, 1, 80, 80));
						break;
				}
				tempX += 80;
			}
			tempY += 80;
		}
		remainingWoodDiv.text("Wood Remaining: " + remainingWoods);
		
		// 동물의 생성 비중에 따라 배열의 크기 차지
		let animalSpawnWeights = [];
		let animalIndex = 0;
		[AnimalPig, AnimalCow].forEach((animal) => {
			for (let i = 0; i < animal.spawnWeight; i++)
				animalSpawnWeights.push(animalIndex);
			animalIndex += 1;
		});
		
		// 동물을 생성하는 함수
		function spawnAnimal() {
			// 현재 화면에 존재하는 동물 개수가 최대 개수보다 많으면 리턴
			if (activeAnimals.length >= maxSpawns)
				return;
			
			let randomInt = Math.floor(Math.random() * 100);
			if (randomInt <= animalSpawnChance) // 동물이 동물 생성 확률 안에 있으면 실제로 생성
			{
				// 동물이 생성되는 x 좌표
				const randomSpawnX = Math.floor(Math.random() * (spawnLineWidthMax - spawnLineWidthMin + 1)) + spawnLineWidthMin;
				// 동물이 생성되는 y좌표
				const randomSpawnY = Math.floor(Math.random() * (spawnLineHeightMax - spawnLineHeightMin + 1)) + spawnLineHeightMin;
				let newAnimal; // 새로운 동물 변수
				
				// 각 동물의 생성 비중에 따라 어느 동물을 생성할 지 결정
				// 이곳에서 각 동물의 속성 변경 가능
				randomInt = Math.floor(Math.random() * animalSpawnWeights.length);
				switch(animalSpawnWeights[randomInt]) {
					case 0:
						newAnimal = new AnimalPig(
							randomSpawnX, // 생성 좌표 x
							randomSpawnY, // 생성 좌표 y
							8, // maxHealth
							2, // hungerDamage
							0.2, // speed
							74, // width - canvas에서의 가로 길이
							52 // height - canvas에서의 세로 길이
						);
						break;
					case 1:
						newAnimal = new AnimalCow(
							randomSpawnX,
							randomSpawnY,
							10,
							3,
							0.16,
							84,
							76
						);
						break;
				}
				if (newAnimal != undefined)
				{
					newAnimal.sayIdle(); // 소리 내기
					activeAnimals.push(newAnimal); // 화면에 존재하는 동물 배열에 추가
				}
			}
			else
				return;
		}
		// 동물을 생성하는 함수는 1초마다 실행됨
		const spawnInterval = setInterval(spawnAnimal, 1000);
		
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
		let ball = new Ball(450, 600, 10, 6, 1 + 6);
		
		// 처음 시작할 때 공 라디안: -45도에서 -135도 사이 범위
		let ballRad = Math.PI * (Math.random() * (-45 + 135) - 135) / 180;
		
		
		// 승리(나무를 모두 캠)한지 또는 패배(허기가 0) 검사
		function checkWinLose() {
			if (remainingWoods <= 0) {
				gameEnded = true;
				return 1;
			}
			if (currentHunger <= 0) {
				currentHunger = 0;
				
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
			
			// 동물이 왼쪽, 오른쪽 움직임
			for (let i in activeAnimals) {
				let animal = activeAnimals[i];
				animal.x += animal.speed;
				
				if (animal.x + animal.width >= maxWidth || animal.x <= 0) {
					animal.sayIdle();
					animal.speed *= -1;
				}
			}
			
			// 음식이 아래로 떨어짐
			for (let i in activeFoods) {
				let food = activeFoods[i];
				food.y += 0.68; // food.y + speed
				// 음식이 먹히지 않고 땅으로 떨어짐
				if (food.y + food.height >= maxHeight) {
					popAudio.play();
					activeFoods.splice(i, 1);
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
					
					currentHunger = Math.max(currentHunger - block.hungerDamage, 0);
					hunger.modify(currentHunger);
					
					if (block.hit(ball.damage)) { // 공에 맞은 블럭이 부숴진 경우, 음식 드롭
						if (block.drop != "") {
							let newFood;
							switch(block.drop) {
								case "apple":
									newFood = new FoodApple(block.x, block.y, 48, 48, 8);
									break;
							}
							popAudio.play();
							activeFoods.push(newFood);
						}
						if (block instanceof BlockLog) {
							remainingWoods -= 1;
							remainingWoodDiv.text("Wood Remaining: " + remainingWoods);
							
						}
						activeBlocks.splice(i, 1);
					}
				}
			}
			
			// 동물과 충돌
			for (let i in activeAnimals) {
				let animal = activeAnimals[i];
				let collideWithAnimal = checkCollision(ball, animal, ballRad);
				
				if (collideWithAnimal != 999) { // 충돌했다면 999가 아닌 수를 반환
					ballRad = collideWithAnimal;
					ballRad += randomBallRad();
					
					currentHunger = Math.max(currentHunger - animal.hungerDamage, 0);
					hunger.modify(currentHunger);
					
					if (animal.hit(ball.damage)) { // 공에 맞은 동물이 죽은 경우, 음식 드롭
						let newFood;
						switch(animal.drop) {
							case "porkchop":
								newFood = new FoodPorkchop(animal.x, animal.y, 48, 48, 12);
								break;
							case "beef":
								newFood = new FoodBeef(animal.x, animal.y, 48, 48, 16);
								break;
						}
						popAudio.play();
						activeFoods.push(newFood);
						
						activeAnimals.splice(i, 1);
					}
				}
			}
			
			// 패들과 음식이 충돌
			for (let i in activeFoods) {
				let food = activeFoods[i];
				let collideWithFood = checkRectCollision(bar, food);
				
				if (collideWithFood) { // 충돌했다면 true
					currentHunger = Math.min(currentHunger + food.saturation, maxHunger);
					hunger.modify(currentHunger);
					food.eat();
					bar.eat();
					
					activeFoods.splice(i, 1);
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
				ball.y = deathLine - 400;
				
				ballFallAudio.play();
				currentHunger = Math.max(currentHunger - 4, 0);
				hunger.modify(currentHunger);
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
			
			// 동물 그리기
			for (let i in activeAnimals) {
				let animal = activeAnimals[i];
				animal.draw(context);
			}
			
			// 음식 그리기
			for (let i in activeFoods) {
				let food = activeFoods[i];
				food.draw(context);
			}
			
			// 승패 여부 - 0 이상이면 승리, 0 이하이면 패배
			let winLoseResult = checkWinLose();
			
			// 마을 체력바 그리기
			hunger.draw(context);
			
			// 패배했을 때 처리
			if (gameEnded && winLoseResult < 0)
			{
				steveDeathAudio.play();
				
				mainMusic.pause(); // 배경음악 멈추기
				defeatMusic.play();
				$("#screen #stage1_remainingWood").remove();
				$("#screen #stage1_volume").remove();
				
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
				context.fillText("Steve starved to death", maxWidth / 2 - 150, maxHeight * 0.25);
				
			}
			// 승리했을 때 처리
			else if (gameEnded && winLoseResult > 0)
			{
				mainMusic.pause(); // 배경음악 멈추기
				victoryMusic.play();
				$("#screen #stage1_remainingWood").remove();
				$("#screen #stage1_volume").remove();
				
				// 승리 배경
				context.fillStyle = 'rgba(102, 255, 0, 0.253)';
				context.fillRect(0, 0, maxWidth, maxHeight);
				
				// 승리 제목
				let font = "bold 80px Arial";
				let textColor = "black";
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
