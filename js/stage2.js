let mousePos = [0, 0];
let mousePadding = 0;

let gameInterval;
let stageStatus = {isPlaying: false};

const gameEnd = (context) => {
	clearInterval(gameInterval);
	setTimeout(() => {
		context.clearRect(0, 0, maxWidth, maxHeight); // clear canvas			
	}, 10);
	$(window).off("mousemove");
};

const checkResult = (context) => {
	gameEnd(context);
	moveNext(0);
};

const stage2Levels = {
	"easy": {
		brick_count: 32,
		bricks_in_row: 8,
		ball_speed: 1,
		barWidth: 250
	},
	"normal": {
		brick_count: 32,
		bricks_in_row: 8,
		ball_speed: 2,
		barWidth: 200
	},
	"hard": {
		brick_count: 32,
		bricks_in_row: 8,
		ball_speed: 3,
		barWidth: 150
	},
}

$(document).ready(function() {
	const reCalc = () => {
		mousePadding = ($(window).width() - $("#myCanvas").width()) / 2;
	};
	reCalc();

	$(window).on("resize", () => {
		reCalc();
	});

	$("#choice .next").eq(1).on("click", () => {

		$(window).on("mousemove", event => {
			mousePos = [
				event.pageX,
				event.pageY
			];
		});
		stageStatus.isPlaying = true;
		startGame(() => {
			$(window).off("mousemove");
		});
	});


	//??
	$("#stage2 .back").on("click", () => {
		stageStatus.isPlaying = false; // 스테이지를 나가면 게임이 끝난 것으로 취급, 아래 코드에서 루프 종료
		const canvas = document.getElementById("myCanvas");
		const context = canvas.getContext("2d");

		gameEnd(context);
	});
});

// brick breaking main logic
function startGame(callBack) {
	
	Ores = {
		WOOD: {order: 0, oreType: "wood", imageSrc: "no", oreHealth: 1, weight: 0},
		STONE: {order: 1, oreType: "stone", imageSrc: "resource/blocks/stone.png", oreHealth: 2, weight: 4}, 
		IRON: {order: 2, oreType: "iron", imageSrc: "resource/blocks/iron_ore.png", oreHealth: 3, weight: 3},
		GOLD: {order: 2, oreType: "gold", imageSrc: "resource/blocks/gold_ore.png", oreHealth: 1, weight: 1},
		DIAMOND: {order: 4, oreType: "diamond", imageSrc: "resource/blocks/diamond_ore.png", oreHealth: 10, weight: 0}
	};
	window.ores = {};
	const canvas = document.getElementById("myCanvas");
	const context = canvas.getContext("2d");

	const deathLine = maxHeight * 0.96;

	const levelInfo = stage2Levels[currentLevel];

	// objects to draw 
	// -> will be divided with property "type"
	// -> and identified with property "id"
	const draws = [];

	// ball id
	const ballId = new Date().getMilliseconds();
	// bar id
	const barId = new Date().getMilliseconds() - 1;
	const barHeight = 20;

	// brick width, height and padding within one another
	const brickAreaWidth = (maxWidth / levelInfo.bricks_in_row);
	const brickAreaHeight = brickAreaWidth;
	const padding = 30;

	// object that maps "position" to "id"
	const brickPosInfo = {};

	// bar object
	let bar = {
		id: barId,
		color: "brown",
		type: "rect",
		from: [100 + maxWidth / 2 - levelInfo.barWidth / 2, deathLine - 100],
		size: [levelInfo.barWidth, barHeight],
	};

	draws.push(bar);

	if(!window.pickaxe) 
		window.pickaxe = {ore: Ores.WOOD, power: 1};

	let ballImage = new Image();

	ballImage.src = `resource/pickaxe/wood_pickaxe.png`;

	console.log(window.pickaxe);

	const ball = { 
		id: ballId,
		color: "red", 
		type: "circle", 
		loc: [450, 600], 
		width: 30, 
		image: ballImage, 
		degree: 0
	};

	// a list that keep tracks the ball's location
	let ballLoc = [450, 600];

	draws.push(ball); 

	// initial ball shooting radian
	let ballRad = Math.PI * (Math.random() - 1) / 4; 

	if(!window.fixedDiamondX) 
		window.fixedDiamondX = Math.floor(Math.random() * levelInfo.bricks_in_row); 

	// add bricks to "draws" and initialize "brickPosInfo"
	for (let i = 0; i < levelInfo.brick_count; i++) { 
		const y = Number.parseInt(i / levelInfo.bricks_in_row); 
		const row = y * brickAreaHeight; 

		const x = (i % levelInfo.bricks_in_row); 
		const col = x * brickAreaWidth; 

		const pos = [col, row]; 
		const posId = new Date().getMilliseconds() + i + 1; 

		let ore = getRandomOre(levelInfo, x, y); 

		brickPosInfo[pos] = { 
			id: posId, 
			ore: ore,
			from: [col + padding / 2, row + padding / 2],
			size: [brickAreaWidth - padding, brickAreaHeight - padding]
		}; 			
			
		if(!window.ores[pos]) {
			let health = ore.oreHealth;
			window.ores[pos] = {};
			window.ores[pos].ore = ore;
			window.ores[pos].health = ore.oreHealth;

			//console.log(pos);
		}
		
		draws.push({
			id: posId,
			ore: ore,
			type: "ore",
			from: [col + padding / 2, row + padding / 2],
			size: [brickAreaWidth - padding, brickAreaHeight - padding],
			pos: pos,
		});
	}

	// main drawing interval
	const draw = (interval, callBack) => {
		context.clearRect(0, 0, maxWidth, maxHeight);
		
		let bgImg = new Image(); 
		bgImg.src = "resource/bg/stage_2_bg.png";
		context.drawImage(
			bgImg, 
			0, 0,
			maxWidth, maxHeight
		)

		switch(window.pickaxe.ore) {
			case Ores.WOOD:
				ball.image.src = `resource/items/wood_pickaxe.png`;
				break;
			case Ores.STONE:
				ball.image.src = `resource/items/stone_pickaxe.png`;
				break;
			case Ores.IRON:
				ball.image.src = `resource/items/iron_pickaxe.png`;
				break;
			case Ores.GOLD:
				ball.image.src = `resource/items/gold_pickaxe.png`;
				break;
			case Ores.DIAMOND:
				ball.image.src = `resource/items/diamond_pickaxe.png`;
				break;
		}

		for (const object of draws) {
			context.beginPath();
			context.strokeStyle = 'black';
			context.fillStyle = 'black';

			// when the object is the bar
			if (object.id === barId) {
				object.from = [
					Math.max(
						0,
						Math.min(
							maxWidth - levelInfo.barWidth, 
							mousePos[0] - mousePadding - levelInfo.barWidth / 2
						)
					),
					object.from[1],
				];
				bar = object;
			}

			// when the object is the ball
			if (object.id == ballId) {
				ballLoc = object.loc; // location track
				
				// collide with vertical wall
				if (object.loc[0] < object.width || object.loc[0] > maxWidth - object.width) {
					ballRad = Math.PI - ballRad;
				}

				// collide with horizontal wall
				if (object.loc[1] < object.width || object.loc[1] > maxHeight - object.width) {
					ballRad = (2 * Math.PI - ballRad);
				}
				
				// refreshing ball's location
				object.loc = [
					object.loc[0] + Math.cos(ballRad) * levelInfo.ball_speed,
					object.loc[1] + Math.sin(ballRad) * levelInfo.ball_speed,
				];

				// collide with bar
				if ((object.loc[1] <= bar.from[1] && object.loc[1] >= bar.from[1] - object.width) &&
					(object.loc[0] >= bar.from[0] && object.loc[0] <= bar.from[0] + levelInfo.barWidth)) {
					ballRad = (2 * Math.PI - ballRad);
				}
				if ((object.loc[1] >= bar.from[1] && object.loc[1] <= bar.from[1] + barHeight) &&
					((object.loc[0] >= bar.from[0] - object.width && object.loc[0] <= bar.from[0]) || 
					 (object.loc[0] <= bar.from[0] + levelInfo.barWidth + object.width && object.loc[0] >= bar.from[0] + levelInfo.barWidth))) {
					ballRad = Math.PI - ballRad; 
				} 

				if (object.loc[1] > deathLine) { 
					checkResult(context);
				}
			}

			// draw the object according to the its type
			switch(object.type) {
				case "circle":
					// context.fillStyle = object.color || "black";
					// context.arc(object.loc[0], object.loc[1], object.width, 0, 2 * Math.PI);
					// context.fill();
					
					context.drawImage( 
						ball.image, 
						object.loc[0] - object.width, 
						object.loc[1] - object.width, 
						2 * object.width, 
						2 * object.width
					);		

					break; 
				case "rect":
					context.fillStyle = object.color || "black";
					context.fillRect(object.from[0], object.from[1], object.size[0], object.size[1]);
					break;
				case "ore":
					//console.log(window.ores[object.pos]);
						
					const destroyStage = Math.floor(10 - (window.ores[object.pos].health / brickPosInfo[object.pos].ore.oreHealth) * 10);

					if(destroyStage > 0 && destroyStage < 10) {
						const destroyMaskImage = new Image();
						let src = `resource/blocks/destroy/${window.ores[object.pos].ore.oreType}_destroy_stage_${destroyStage}.png`;
						
						//console.log(src);

						destroyMaskImage.src = src;
						context.drawImage( 
							destroyMaskImage, 
							object.from[0], object.from[1], object.size[0], object.size[1]
						);	
					} else {
						const oreImg = new Image();
						oreImg.src = object.ore.imageSrc;

						context.drawImage( 
							oreImg, 
							object.from[0], object.from[1], object.size[0], object.size[1]
						);	
					}

					break; 
				default:
					break;
			}
			context.stroke();
			context.closePath();
		}

		// calculating brick that the ball will collide with
		let brickX = (
			Number.parseInt(
				(ballLoc[0] + Math.cos(ballRad) * (levelInfo.ball_speed)) / brickAreaWidth
			) % levelInfo.bricks_in_row
		) * brickAreaWidth;
		// limit brick's x position
		brickX = Math.max(0, brickX);
		brickX = Math.min(maxWidth - brickAreaWidth, brickX);

		const brickY = Number.parseInt((ballLoc[1] + Math.sin(ballRad) * (levelInfo.ball_speed)) / brickAreaHeight) * brickAreaHeight;

		const collidePos = [brickX, brickY];
	
		// check if brick really exists
		if (brickPosInfo[collidePos]) {
			let isBounced = false; 

			// find the real brick object according to its id
			const target = draws.find(v => v.id === brickPosInfo[collidePos].id);

			if (((ballLoc[0] >= brickX + padding / 2 - ball.width && ballLoc[0] <= brickX + padding / 2) || (ballLoc[0] <= brickX - padding / 2 + brickAreaWidth + ball.width && ballLoc[0] >= brickX - padding / 2 + brickAreaWidth)) && 
				(ballLoc[1] >= brickY + padding / 2 && ballLoc[1] <= brickY + brickAreaHeight - padding / 2)) {
				ballRad = Math.PI - ballRad; 
				isBounced = true; 
			}

			if ((ballLoc[0] >= brickX + padding / 2 && ballLoc[0] <= brickX + brickAreaWidth - padding / 2) && 
				((ballLoc[1] >= brickY + padding / 2 - ball.width && ballLoc[1] <= brickY + padding / 2) || (ballLoc[1] <= brickY - padding / 2 + brickAreaHeight + ball.width && ballLoc[1] >= brickY - padding / 2 + brickAreaHeight))) {
				ballRad = (2 * Math.PI - ballRad); 
				isBounced = true; 
			}

			if (isBounced) {

				// HP calculation
				window.ores[collidePos].health -= window.pickaxe.power;

				//check destroys the ore
				if(window.ores[collidePos].health <= 0) {
					window.ores[collidePos].health = 0;
					
					//check if breaks diamond => end
					if(brickPosInfo[collidePos].ore === Ores.DIAMOND) gameEnd(context);

					//change pickaxe material
					if(brickPosInfo[collidePos].ore !== window.pickaxe.ore && 
						brickPosInfo[collidePos].ore.order >= window.pickaxe.ore.order) {

						window.pickaxe.ore = brickPosInfo[collidePos].ore;
						window.pickaxe.power = brickPosInfo[collidePos].ore.oreHealth;
						console.log(window.pickaxe.ore);
						console.log(brickPosInfo[collidePos].ore);
					}

					draws.splice(draws.indexOf(target), 1);
					delete brickPosInfo[collidePos];
				}
			}
		}
		// if it's true, show the target brick's hitbox
		// if (debugObtions.showHitBox) {
		// 	context.fillStyle = 'rgba(10, 60, 10, 0.5)';

		// 	context.fillRect(brickX + padding / 2, brickY + padding / 2, brickAreaWidth - padding, brickAreaHeight - padding);
		// 	context.fillRect(brickX + padding / 2 - ball.width, brickY + padding / 2 - ball.width, brickAreaWidth - padding + ball.width * 2, brickAreaHeight - padding + ball.width * 2);	
		// }
	}

	gameInterval = setInterval(() => draw(gameInterval, gameEnd));
}

function getRandomOre(info, x, y) {
	if(x == window.fixedDiamondX && y == 0) return Ores.DIAMOND;

	//console.log(x + ", " + y);

	let maxY = info.brick_count / info.bricks_in_row - 1;
	let ores = Object.values(Ores);
	let maxWeight = ores.map(ore => ore.weight).reduce((c, n) => c < n ? n : c);

	let weightenList = [];
	ores.forEach(ore => {
		
		//console.log(ore);
		
		let proportion = Math.ceil(ore.weight / maxWeight * maxY);
		if(proportion >= y)
			Array(ore.weight).fill(0).forEach(() => weightenList.push(ore));
	});

	let randIdx = (Math.floor(Math.random() * weightenList.length));
	return weightenList[randIdx];
}

let Ores = {
	WOOD: {order: 0, oreType: "wood", imageSrc: "no", oreHealth: 1, weight: 0},
	STONE: {order: 1, oreType: "stone", imageSrc: "resource/blocks/stone.png", oreHealth: 2, weight: 4}, 
	IRON: {order: 2, oreType: "iron", imageSrc: "resource/blocks/iron_ore.png", oreHealth: 3, weight: 3},
	GOLD: {order: 2, oreType: "gold", imageSrc: "resource/blocks/gold_ore.png", oreHealth: 1, weight: 1},
	DIAMOND: {order: 4, oreType: "diamond", imageSrc: "resource/blocks/diamond_ore.png", oreHealth: 10, weight: 0}
};