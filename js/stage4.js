let mousePos = [0, 0];
let canvasPosition;
let mousePadding = 0;

let trackIds = [];
let gameInterval;

const damage = 5;

const gameEnd = (context) => {
	clearInterval(gameInterval);
	setTimeout(() => {
		context.clearRect(0, 0, maxWidth, maxHeight); // clear canvas			
	}, 10);
	$(window).off("mousemove");
};

$(document).ready(function() {
	const reCalc = () => {
		canvasPosition = $("canvas").position();
		mousePadding = ($(window).width() - $("#myCanvas").width()) / 2;
	};
	reCalc();

	$(window).on("resize", () => {
		reCalc();
	});

	$("#choice .next").eq(3).on("click", () => {

		$(window).on("mousemove", event => {
			mousePos = [
				event.pageX,
				event.pageY
			];
		});

		startGame();
	});

	$("#stage4 .back").on("click", () => {
		const canvas = document.getElementById("myCanvas");
		const context = canvas.getContext("2d");

		gameEnd(context);
	});

});

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

const debugObtions = {
	showHitBox: false,
	addTrackBrick: (id) => {
		trackIds.push(id);
	}
};

// level information
const stage4Levels = {
	"easy": {
		brick_intenity: 1,
		bricks_in_row: 6,
		frquency: 0.2,
		ball_speed: 2,
		plane_size: 4,
	},
	"normal": {
		brick_intenity: 1,
		bricks_in_row: 10,
		frquency: 0.2,
		ball_speed: 1,
		plane_size: 4,
	},
	"hard": {
		brick_intenity: 1,
		bricks_in_row: 10,
		frquency: 0.2,
		ball_speed: 1,
		plane_size: 4,
	},
}

// brick breaking main logic
function startGame() {
	
	const canvas = document.getElementById("myCanvas");
	const context = canvas.getContext("2d");

	const deathLine = maxHeight * 0.98;

	const levelInfo = stage4Levels[currentLevel];

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
	const brickAreaWidth = Math.round(maxWidth / levelInfo.bricks_in_row);
	const brickAreaHeight = brickAreaWidth;
	const padding = 40;

	const backgroundImg = new Image();
	backgroundImg.src = "/resource/background/stage4_background.png";
	
	const wallImg = new Image();
	wallImg.src = "/resource/background/stage4_background_wall.png";
	
	const spawnerImg = new Image();
	spawnerImg.src = "/resource/blocks/mob_spawner.png";

	const heart = new Heart(20, 20);

	// object that maps "position" to "id"
	let brickPosInfo = {};

	// brickIds
	const brickIds = [];

	// bar object
	let bar = {
		id: barId,
		color: "brown",
		type: "rect",
		loc: [100 + maxWidth / 2 - barWidth / 2, deathLine - 100],
		size: [barWidth, barHeight],
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

	const spawner = {
		id: Math.random(),
		color: "rgba(60, 10, 10, 0.5)",
		type: "mob",
		class: new MobBlaze(maxWidth / 2 - brickAreaWidth / 2, 0, 100, 10, 0, brickAreaWidth, brickAreaHeight, 1000),
	};
	draws[spawner.id] = spawner;


	// initial ball shooting radian
	let ballRad = Math.PI * (Math.random() - 2) / 6;
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
		"left": (canvasPosition.left + 40) + "px",
		"top": (canvasPosition.top + 70) + "px",
		"width": "180px",
		"height": "80px",
		"line-height": "80px",
		"text-align": "center",
		"font": "30px bold Arial",
		"color": "#7bf318"
	});
	expDiv.text("XP: 0");
	$(canvas).parent().append(expDiv);

	// add bricks to "draws" and initialize "brickPosInfo"
	const spawnBricks = () => {
		for (let i = 0; i < levelInfo.bricks_in_row; i++) {
			if (Math.random() > levelInfo.frquency) {
				continue;
			}

			const row = Number.parseInt(i / levelInfo.bricks_in_row) * brickAreaHeight;
			const col = (i % levelInfo.bricks_in_row) * brickAreaWidth;
			
			const pos = [col, row];
	
			brickPosInfo[pos] = Math.random();
	
			brickIds.push(brickPosInfo[pos]);
	
			const currentMob = {
				id: brickPosInfo[pos],
				color: "rgba(60, 10, 10, 0.5)",
				type: "mob",
				class: new MobBlaze(col + padding / 2, row + padding / 2, 10, 5, brickDy, brickAreaWidth - padding, brickAreaHeight - padding, 20),
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
		if (object.loc[1] < object.radius + brickAreaHeight || object.loc[1] > maxHeight - object.radius) {
			ballRad = (2 * Math.PI - ballRad);
		}
		
		// refreshing ball's location
		object.loc = [
			object.loc[0] + Math.cos(ballRad) * levelInfo.ball_speed,
			object.loc[1] + Math.sin(ballRad) * levelInfo.ball_speed,
		];

		// collide with bar
		if ((object.loc[1] <= bar.loc[1] && object.loc[1] >= bar.loc[1] - object.radius) &&
			(object.loc[0] >= bar.loc[0] && object.loc[0] <= bar.loc[0] + barWidth)) {
			ballRad = (2 * Math.PI - ballRad);
		}
		if ((object.loc[1] <= bar.loc[1] + barHeight + object.radius && object.loc[1] >= bar.loc[1] + barHeight) &&
			(object.loc[0] >= bar.loc[0] && object.loc[0] <= bar.loc[0] + barWidth)) {
			ballRad = (2 * Math.PI - ballRad);
		}
		if ((object.loc[0] <= bar.loc[0] && object.loc[0] >= bar.loc[0] - object.radius) &&
			(object.loc[1] >= bar.loc[1] && object.loc[1] <= bar.loc[1] + barHeight)) {
			ballRad = Math.PI - ballRad;  
		}
		if ((object.loc[0] <= bar.loc[0] + barWidth + object.radius && object.loc[0] >= bar.loc[0] + object.radius) &&
			(object.loc[1] >= bar.loc[1] && object.loc[1] <= bar.loc[1] + barHeight)) {
			ballRad = Math.PI - ballRad;  
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
		if(mob.y > deathLine - 60) {
			callBack();
			delete draws[object.id];
			delete brickPosInfo[pos];
			return;
		}
	};
	
	let expLabels = [];
	let obtainedXp = 0; 

	// main drawing interval
	const draw = (callBack) => {
		brickPosInfo = {};
		brickProgress = (brickProgress + brickDy) % (brickAreaHeight);

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
			brickAreaHeight
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
					heart.attack(2);
				});
			}

			// when the object is the brick
			if (brickIds.includes(object.id)) {
				processBrick(object, () => {
					object.class.sayAttack();
					heart.attack(object.class.damage);
				});
			}

			if (trackIds.includes(object.id)) {
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
		context.drawImage(
			spawnerImg,
			0,
			0,
			200,
			200,
			maxWidth / 2 - brickAreaWidth / 2,
			0,
			brickAreaWidth,
			brickAreaHeight
		);

		// 경험치 라벨 그리기
		for(var i in expLabels) {
			let expLabel = expLabels[i];
			if(expLabel.draw(context)) {
				expLabels.splice(i, 1);
			}
		}

		// calculating brick that the ball will collide with
		let brickX = (
			Number.parseInt(
				(ballLoc[0] + Math.cos(ballRad) * (levelInfo.ball_speed + 2)) / brickAreaWidth
			) % levelInfo.bricks_in_row
		) * brickAreaWidth;

		// limit brick's x position
		brickX = Math.max(0, brickX);
		brickX = Math.min(maxWidth - brickAreaWidth, brickX);

		const brickY = Number.parseInt((ballLoc[1] - brickProgress + Math.sin(ballRad) * (levelInfo.ball_speed + 2)) / brickAreaHeight) * brickAreaHeight + brickProgress;

		const targetId = brickPosInfo[[brickX, brickY + brickDy]] || brickPosInfo[[brickX, brickY - brickDy]] || brickPosInfo[[brickX, brickY]];

		// check if brick really exists
		if (targetId) {
			// debugObtions.addTrackBrick(targetId);
			// console.log(targetId);

			let isBounced = false;

			// find the real brick object according to its id
			const target = draws[targetId];

			if (target.type === "mob" && target.class.status === "") {
				if (((ballLoc[0] >= brickX + padding / 2 - ball.radius && ballLoc[0] <= brickX + padding / 2) || (ballLoc[0] <= brickX - padding / 2 + brickAreaWidth + ball.radius && ballLoc[0] >= brickX - padding / 2 + brickAreaWidth)) && 
				(ballLoc[1] >= brickY + padding / 2 && ballLoc[1] <= brickY + brickAreaHeight - padding / 2)) {
					ballRad = Math.PI - ballRad;
					isBounced = true;
				}

				if ((ballLoc[0] >= brickX + padding / 2 && ballLoc[0] <= brickX + brickAreaWidth - padding / 2) && 
					((ballLoc[1] >= brickY + padding / 2 - ball.radius && ballLoc[1] <= brickY + padding / 2) || (ballLoc[1] <= brickY - padding / 2 + brickAreaHeight + ball.radius && ballLoc[1] >= brickY - padding / 2 + brickAreaHeight))) {
					ballRad = (2 * Math.PI - ballRad);
					isBounced = true;
				}
			}
			
			if (isBounced) {
				if (target.class.status === "") {
					if (target.class.hit(damage)) {
						let expLabel = new ExperienceLabel(target.class.x, target.class.y, target.class.exp);
						expLabel.ding();
						expLabels.push(expLabel);
						obtainedXp += target.class.exp;
						$(expDiv).text("XP: " + obtainedXp);

						delete draws[targetId];
						delete brickPosInfo[[brickX, brickY]];				
					}
				}

				return;
			}
		}
		// if it's true, show the target brick's hitbox
		if (debugObtions.showHitBox) {
			context.fillStyle = 'rgba(10, 60, 10, 0.5)';

			context.fillRect(brickX + padding / 2, brickY + padding / 2, brickAreaWidth - padding, brickAreaHeight - padding);
			context.fillRect(brickX + padding / 2 - ball.radius, brickY + padding / 2 - ball.radius, brickAreaWidth - padding + ball.radius * 2, brickAreaHeight - padding + ball.radius * 2);	
		}
	}

	gameInterval = setInterval(() => draw(gameInterval, gameEnd));
}
