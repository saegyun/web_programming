class MobBlaze extends Mob {
	constructor(x, y, maxHealth, damage, speed, width, height, exp) {
		super(x, y, maxHealth, damage, speed, width, height, 8, 200, 192, exp); // Mob 클래스의 생성자 호출
		MobBlaze.idleSprite.src = "resource/sprite/blaze.png"; // 걷는 sprite
		MobBlaze.hurtSprite.src = "resource/sprite/blaze_hurt.png"; // 맞았을 때 sprite
	}
	static idleSprite = new Image(); 
	static hurtSprite = new Image();
	static idleAudios = [new Audio("resource/sound/blaze_idle.mp3")]; // 생성될 때 소리
	static hurtAudios = [new Audio("resource/sound/blaze_hit.mp3")]; // 맞았을 때 소리
	static deathAudios = [new Audio("resource/sound/blaze_death.mp3")]; // 죽었을 때 소리
	static attackAudios = [new Audio("resource/sound/blaze_shoot.mp3")]; // 마을을 때릴 때 소리

	draw(context) { // 캔버스에 그리기, Mob 클래스의 draw() 호출
		super.draw(context, MobBlaze.idleSprite, MobBlaze.hurtSprite);
	}

	sayIdle() { // 생성할 때 소리 내기
		super.say(MobBlaze.idleAudios);
	}
	
	sayAttack() { // 마을에 도착했을 때 소리 내기
		super.say(MobBlaze.attackAudios);
	}

	hit(damage) { // 몹이 맞았을 때 함수, hit() 함수의 결과 반환 (죽으면 true, 아직 살아있으면 false) 
		return super.hit(damage, MobBlaze.hurtAudios, MobBlaze.deathAudios);
	}
}

class Spawner {
	breakCnt;
	brokenImgs = [];

	spawnerImg;
	hitSound;

	constructor(breakCnt) {
		this.hitCnt = -1;		
		this.breakCnt = breakCnt;
			
		this.spawnerImg = new Image();
		this.spawnerImg.src = "resource/blocks/mob_spawner.png";

		this.hitSound = new Audio("resource/sound/item_break.ogg");

		for (let i = 0; i <= 9; i++) {
			const img = new Image();
			img.src = `resource/blocks/break/broken_${i}.png`;
			this.brokenImgs.push(img);
		}
	}

	draw(context) {
		const drawImage = (img) => {
			context.drawImage(
				img,
				0,
				0,
				200,
				200,
				maxWidth / 2 - Stage4.brickAreaWidth / 2,
				0,
				Stage4.brickAreaWidth,
				Stage4.brickAreaHeight
			);
		};
		drawImage(this.spawnerImg);
		if (this.hitCnt != -1) {
			drawImage(this.brokenImgs[Math.min(this.hitCnt, 9)]);
		}
	}

	hit(increase, cb) {
		this.hitCnt += increase;
		this.hitSound.play();
		if (this.hitCnt >= 9) {
			cb();
		}
	}
}

const Stage4 = {
	mainMusic: new Audio("resource/sound/stage4_music.ogg"), // 배경 음악
	failMusic: new Audio("resource/sound/stage3_defeat.ogg"), // 패배 음악
	victoryMusic: new Audio("resource/sound/stage3_victory.ogg"), // 승리 음악
	brickAreaWidth: undefined,
	brickAreaHeight: undefined,
	canvasPosition: undefined,
	obtainedXp: 0,
	isSuccess: false,
	trackIds: [],
	gameEnd: (context) => {
		Stage4.mainMusic.pause();
		clearInterval(gameInterval);
		$("#stage4_exp").remove();
		$("#screen #stage4_volume").remove(); // 볼륨 버튼 없애기
		setTimeout(() => {
			context.clearRect(0, 0, maxWidth, maxHeight); // clear canvas			
		}, 10);
		$(window).off("mousemove");
	},
	checkResult: (context) => {
		PlayStatus.stat.exp += Stage4.obtainedXp;

		if (!Stage4.isSuccess) {
			Stage4.failMusic.play();
			$("#stage4-result").css({
				"background-color": "rgba(255, 0, 0, 0.253)",
			});
			$("#stage4-result > h1").text("You died!");
			// $("#stage4-result > .result-buttons > button").eq(1).attr("disabled", true);
		} else {
			Stage4.victoryMusic.play();
			$("#stage4-result").css({
				"background-color": "rgba(102, 255, 0, 0.253)",
			});
			$("#stage4-result > h1").text("You Successed!");
			// $("#stage4-result > .result-buttons > button").eq(1).attr("disabled", false);
		}
		$("#stage4-result > p").text("Obtained Exp : " + Stage4.obtainedXp);
		Stage4.gameEnd(context);
		moveNext(0);
	},
	debugOptions: {
		showHitBox: false,
		addTrackBrick: (id) => {
			Stage4.trackIds.push(id);
		}
	},
	// level information
	stage4Levels: {
		"easy": {
			brick_intenity: 1,
			bricks_in_row: 6,
			frquency: 0.1,
			spawnerHitCnt: 3,
			ball_speed: 2,
		},
		"normal": {
			brick_intenity: 1,
			bricks_in_row: 8,
			frquency: 0.15,
			spawnerHitCnt: 2,
			ball_speed: 2,
		},
		"hard": {
			brick_intenity: 1,
			bricks_in_row: 10,
			frquency: 0.2,
			spawnerHitCnt: 1,
			ball_speed: 2,
		},
	},
	// brick breaking main logic
	startGame: (level) => {
		Stage4.obtainedXp = 0;

		Stage4.isSuccess = false;

		const canvas = document.getElementById("myCanvas");
		const context = canvas.getContext("2d");

		const deathLine = maxHeight * 0.98;

		const levelInfo = Stage4.stage4Levels[level];

		// objects to draw 
		// -> will be divided with property "type"
		// -> and identified with property "id"
		const draws = {};

		// ball id
		const ballId = Math.random();
		// bar id
		const barId = Math.random();
		const barWidth = 200;
		const barHeight = 40;

		// brick width, height and padding within one another
		Stage4.brickAreaWidth = Math.round(maxWidth / levelInfo.bricks_in_row);
		Stage4.brickAreaHeight = Stage4.brickAreaWidth;
		
		const padding = 40;

		const backgroundImg = new Image();
		backgroundImg.src = "resource/background/stage4_background.png";
		
		const wallImg = new Image();
		wallImg.src = "resource/background/stage4_background_wall.png";

		const paddleImg = new Image();
		paddleImg.src = "resource/sprite/magma_slime_paddle.png";

		const heart = new Heart(20, 20);
		const spawner = new Spawner(9);

		// object that maps "position" to "id"
		let brickPosInfo = {};

		// brickIds
		const brickIds = [];

		// bar object
		let bar = {
			id: barId,
			type: "bar",
			loc: [100 + maxWidth / 2 - barWidth / 2, deathLine - 100],
			size: [barWidth, barHeight],
			sound: [new Audio("resource/sound/slime_paddle_1.ogg"), new Audio("resource/sound/slime_paddle_2.ogg"), new Audio("resource/sound/slime_paddle_3.ogg"), new Audio("resource/sound/slime_paddle_4.ogg")],
		};

		draws[barId] = bar;

		// ball object
		const ball = {
			id: ballId,
			color: "red",
			type: "circle",
			loc: [450, 600],
			radius: 10,
		};

		// a list that keep tracks the ball's location
		let ballLoc = [450, 600];

		draws[ballId] = ball;

		const spawnerBlaze = {
			id: Math.random(),
			color: "rgba(60, 10, 10, 0.5)",
			type: "mob",
			class: new MobBlaze(maxWidth / 2 - Stage4.brickAreaWidth / 2, 0, 100, 10, 0, Stage4.brickAreaWidth, Stage4.brickAreaHeight, 1000),
		};
		draws[spawner.id] = spawnerBlaze;


		// initial ball shooting radian
		const poassibleRadians = [
			-Math.PI * (1 / 6 + Math.random() / 6),
			-Math.PI * (5 / 6 - Math.random() / 6),
		];
		let ballRad = poassibleRadians[Math.floor(Math.random() * 2)];
		// let ballRad = Math.PI * (Math.random() - 1) / 6;

		// movement for eachBricks
		let brickDy = 0.125;

		// tracking how bricks go down
		let brickProgress = 0;

		// 획득 경험치를 표시하는 div, 왼쪽 상단에 배치됨
		const expDiv = $("<div />").attr("id", "stage4_exp");
		$(expDiv).css({
			"position": "absolute",
			"z-index": "1",
			"left": (Stage4.canvasPosition.left + 40) + "px",
			"top": (Stage4.canvasPosition.top + 70) + "px",
			"width": "180px",
			"height": "80px",
			"line-height": "80px",
			"text-align": "center",
			"font": "30px bold Arial",
			"color": "#7bf318"
		});
		expDiv.text("XP: 0");
		$(canvas).parent().append(expDiv);
		
		// 배경 음악
		Stage4.mainMusic.volume = 0.8; // 음악 볼륨
		Stage4.mainMusic.play();
		
		// 볼륨 버튼
		const volumeDiv = $("<div />").attr("id", "stage4_volume");
		let volumeOn = true;
		volumeDiv.append($("<img />").attr("src", "resource/sprite/volume_on.png").attr("width", "60px").attr("height", "60px"));
		$(volumeDiv).css({
			"position": "absolute",
			"z-index": "1",
			"height": "60px",
			"left": (Stage4.canvasPosition.left + 700) + "px",
			"top": (Stage4.canvasPosition.top + 710) + "px",
			"line-height": "80px",
		});
		volumeDiv.on("click", function() {
			if (volumeOn) {
				volumeOn = false;
				Stage4.mainMusic.volume = 0.0;
				volumeDiv.find("img").attr("src", "resource/sprite/volume_off.png");
			}
			else {
				volumeOn = true;
				Stage4.mainMusic.volume = 0.8;
				volumeDiv.find("img").attr("src", "resource/sprite/volume_on.png");
			}
		});
		$(canvas).parent().append(volumeDiv);

		// add bricks to "draws" and initialize "brickPosInfo"
		const spawnBricks = () => {
			for (let i = 0; i < levelInfo.bricks_in_row; i++) {
				if (Math.random() > levelInfo.frquency) {
					continue;
				}

				const row = Number.parseInt(i / levelInfo.bricks_in_row) * Stage4.brickAreaHeight;
				const col = (i % levelInfo.bricks_in_row) * Stage4.brickAreaWidth;
				
				const pos = [col, row];
		
				brickPosInfo[pos] = Math.random();
		
				brickIds.push(brickPosInfo[pos]);
		
				const currentMob = {
					id: brickPosInfo[pos],
					color: "rgba(60, 10, 10, 0.5)",
					type: "mob",
					class: new MobBlaze(col + padding / 2, row + padding / 2, 10, 5, brickDy, Stage4.brickAreaWidth - padding, Stage4.brickAreaHeight - padding, 20),
				};

				draws[currentMob.id] = currentMob;
				currentMob.class.sayIdle();
			}
		}
		spawnBricks();

		
		const processBar = (object) => {
			object.loc = [
				Math.max(
					0,
					Math.min(
						maxWidth - barWidth, 
						mousePos[0] - mousePadding - barWidth / 2
					)
				),
				object.loc[1],
			];
			bar = object;
		};

		const processBall = (object, callBack) => {
			ballLoc = object.loc; // location track
					
			// collide with vertical wall
			if (object.loc[0] < object.radius || object.loc[0] > maxWidth - object.radius) {
				ballRad = Math.PI - ballRad;
			}

			// collide with horizontal wall
			if (object.loc[1] < object.radius + Stage4.brickAreaHeight || object.loc[1] > maxHeight - object.radius) {
				ballRad = (2 * Math.PI - ballRad);
				if (object.loc[1] < maxHeight * 0.5 && 
					(object.loc[0] > maxWidth / 2 - Stage4.brickAreaWidth / 2 && object.loc[0] < maxWidth / 2 + Stage4.brickAreaWidth / 2)) {
						spawner.hit(levelInfo.spawnerHitCnt, () => {
							Stage4.isSuccess = true;
							Stage4.checkResult(context);
						});
				}
			}
			
			// refreshing ball's location
			object.loc = [
				object.loc[0] + Math.cos(ballRad) * levelInfo.ball_speed,
				object.loc[1] + Math.sin(ballRad) * levelInfo.ball_speed,
			];

			let isCollided = false;

			// collide with bar
			if ((object.loc[1] <= bar.loc[1] && object.loc[1] >= bar.loc[1] - object.radius) &&
				(object.loc[0] >= bar.loc[0] && object.loc[0] <= bar.loc[0] + barWidth)) {
				ballRad = (2 * Math.PI - ballRad);
				isCollided = true;
			}
			if ((object.loc[1] <= bar.loc[1] + barHeight + object.radius && object.loc[1] >= bar.loc[1] + barHeight) &&
				(object.loc[0] >= bar.loc[0] && object.loc[0] <= bar.loc[0] + barWidth)) {
				ballRad = (2 * Math.PI - ballRad);
				isCollided = true;
			}
			if ((object.loc[0] <= bar.loc[0] && object.loc[0] >= bar.loc[0] - object.radius) &&
				(object.loc[1] >= bar.loc[1] && object.loc[1] <= bar.loc[1] + barHeight)) {
				ballRad = Math.PI - ballRad;  
				isCollided = true;
			}
			if ((object.loc[0] <= bar.loc[0] + barWidth + object.radius && object.loc[0] >= bar.loc[0] + object.radius) &&
				(object.loc[1] >= bar.loc[1] && object.loc[1] <= bar.loc[1] + barHeight)) {
				ballRad = Math.PI - ballRad;  
				isCollided = true;
			}
			if (isCollided) {
				bar.sound[Math.floor(Math.random() * bar.sound.length)].play();
			}

			if (object.loc[1] > deathLine) {
				callBack();
			}
		};

		const processBrick = (object, callBack) => {
			const mob = object.class;
			const pos = [mob.x - padding / 2, mob.y - padding / 2];
			
			pos[1] += mob.speed;
			mob.y += mob.speed;

			brickPosInfo[pos] = object.id;

			// 몹이 마을에 도달했을 때 (아래 끝까지)
			if (mob.y > deathLine - 60) {
				callBack();
				delete draws[object.id];
				delete brickPosInfo[pos];
				return;
			}
		};
		
		let expLabels = [];

		// main drawing interval
		const draw = (callBack) => {
			brickPosInfo = {};
			brickProgress = (brickProgress + brickDy) % (Stage4.brickAreaHeight);

			if (brickProgress < brickDy) {
				spawnBricks();
			}

			context.clearRect(0, 0, maxWidth, maxHeight);
			context.drawImage(
				backgroundImg,
				0,
				0,
				720,
				720,
				0,
				0,
				maxWidth,
				maxHeight
			);
			context.drawImage(
				wallImg,
				0,
				0,
				720,
				140,
				0,
				0,
				maxWidth,
				Stage4.brickAreaHeight
			);
			heart.draw(context, maxWidth / 2 - 270, maxHeight - 40, 40, 40, 10);
			for (const [key, object] of Object.entries(draws)) {
				let isTracked = 0;

				context.beginPath();
				context.strokeStyle = 'black';		
				context.fillStyle = 'black';

				// when the object is the bar
				if (object.id === barId) {
					processBar(object);
				}

				// when the object is the ball
				if (object.id == ballId) {
					processBall(object, () => {
						heart.attack(2, () => {
							Stage4.checkResult(context);
						});
					});
				}

				// when the object is the brick
				if (brickIds.includes(object.id)) {
					processBrick(object, () => {
						object.class.sayAttack();
						heart.attack(object.class.damage, () => {
							Stage4.checkResult(context);
						});
					});
				}

				if (Stage4.trackIds.includes(object.id)) {
					isTracked = 1;
				}

				// draw the object according to the its type
				switch(object.type) {
					case "circle":
						context.fillStyle = isTracked ? "red" : object.color || "black";
						
						context.arc(object.loc[0], object.loc[1], object.radius, 0, 2 * Math.PI);
						context.fill();
						break;
					case "rect":
						context.fillStyle = isTracked ? "red" : object.color || "black";
						context.fillRect(object.loc[0], object.loc[1], object.size[0], object.size[1]);
						break;
					case "bar":
						context.drawImage(
							paddleImg,
							0,
							0,
							barWidth,
							barHeight,
							object.loc[0], 
							object.loc[1], 
							object.size[0], 
							object.size[1]
						);
						break;
					case "mob":
						object.class.draw(context);
						// context.fillStyle = isTracked ? "red" : object.color || "black";
						// context.fillRect(object.class.x, object.class.y, object.class.width, object.class.height);
						break;
					default:
						break;
				}
				
				context.stroke();
				context.closePath();
			}
			spawner.draw(context);
			
			// 경험치 라벨 그리기
			for (let i in expLabels) {
				let expLabel = expLabels[i];
				if (expLabel.draw(context)) {
					expLabels.splice(i, 1);
				}
			}

			// calculating brick that the ball will collide with
			let brickX = (
				Number.parseInt(
					(ballLoc[0] + Math.cos(ballRad) * (levelInfo.ball_speed + 2)) / Stage4.brickAreaWidth
				) % levelInfo.bricks_in_row
			) * Stage4.brickAreaWidth;

			// limit brick's x position
			brickX = Math.max(0, brickX);
			brickX = Math.min(maxWidth - Stage4.brickAreaWidth, brickX);

			const brickY = Number.parseInt((ballLoc[1] - brickProgress + Math.sin(ballRad) * (levelInfo.ball_speed + 2)) / Stage4.brickAreaHeight) * Stage4.brickAreaHeight + brickProgress;

			const targetId = brickPosInfo[[brickX, brickY + brickDy]] || brickPosInfo[[brickX, brickY - brickDy]] || brickPosInfo[[brickX, brickY]];

			// check if brick really exists
			if (targetId) {
				// Stage4.debugOptions.addTrackBrick(targetId);
				// console.log(targetId);

				let isBounced = false;

				// find the real brick object according to its id
				const target = draws[targetId];

				if (target.type === "mob" && target.class.status === "") {
					if (((ballLoc[0] >= brickX + padding / 2 - ball.radius && ballLoc[0] <= brickX + padding / 2) || (ballLoc[0] <= brickX - padding / 2 + Stage4.brickAreaWidth + ball.radius && ballLoc[0] >= brickX - padding / 2 + Stage4.brickAreaWidth)) && 
					(ballLoc[1] >= brickY + padding / 2 && ballLoc[1] <= brickY + Stage4.brickAreaHeight - padding / 2)) {
						ballRad = Math.PI - ballRad;
						isBounced = true;
					}

					if ((ballLoc[0] >= brickX + padding / 2 && ballLoc[0] <= brickX + Stage4.brickAreaWidth - padding / 2) && 
						((ballLoc[1] >= brickY + padding / 2 - ball.radius && ballLoc[1] <= brickY + padding / 2) || (ballLoc[1] <= brickY - padding / 2 + Stage4.brickAreaHeight + ball.radius && ballLoc[1] >= brickY - padding / 2 + Stage4.brickAreaHeight))) {
						ballRad = (2 * Math.PI - ballRad);
						isBounced = true;
					}
				}
				
				if (isBounced) {
					if (target.class.status === "") {
						if (target.class.hit(getPlayerDamage())) {
							let expLabel = new ExperienceLabel(target.class.x, target.class.y, target.class.exp);
							expLabel.ding();
							expLabels.push(expLabel);
							Stage4.obtainedXp += target.class.exp;
							$(expDiv).text("XP: " + Stage4.obtainedXp);

							delete draws[targetId];
							delete brickPosInfo[[brickX, brickY]];				
						}
					}

					return;
				}
			}
			// if it's true, show the target brick's hitbox
			// if (Stage4.debugOptions.showHitBox) {
			// 	context.fillStyle = 'rgba(10, 60, 10, 0.5)';

			// 	context.fillRect(brickX + padding / 2, brickY + padding / 2, Stage4.brickAreaWidth - padding, Stage4.brickAreaHeight - padding);
			// 	context.fillRect(brickX + padding / 2 - ball.radius, brickY + padding / 2 - ball.radius, Stage4.brickAreaWidth - padding + ball.radius * 2, Stage4.brickAreaHeight - padding + ball.radius * 2);	
			// }
		}

		gameInterval = setInterval(() => draw(gameInterval, Stage4.checkResult));
	}
}

$(document).ready(function() {
	const reCalc = () => {
		Stage4.canvasPosition = $("canvas").position();
		mousePadding = ($(window).width() - $("#myCanvas").width()) / 2;
	};
	reCalc();

	$(window).on("resize", () => {
		reCalc();
	});

	$(".level-btn").on("click", function() {
		if (currentStage === "stage 4") {
			moveNext(3);
			$(window).on("mousemove", event => {
				mousePos = [
					event.pageX,
					event.pageY
				];
			});
	
			Stage4.startGame($(this).val());
		}
	});

	$("#stage4 .back").on("click", () => {
		const canvas = document.getElementById("myCanvas");
		const context = canvas.getContext("2d");

		Stage4.gameEnd(context);
	});

});