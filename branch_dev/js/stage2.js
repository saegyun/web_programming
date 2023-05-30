const Stage2 = {
	sound: [new Audio("resource/sound/player_hurt.mp3")],
	mainMusic: new Audio("resource/sound/stage2_music.ogg"), // 배경 음악
	failMusic: new Audio("resource/sound/stage3_defeat.ogg"), // 패배 음악
	victoryMusic: new Audio("resource/sound/stage2_victory.ogg"), // 승리 음악
	stageStatus: { isPlaying: false },
	pickaxeStatus: undefined,
	gameEnd: (context) => {
		//초기화
		//console.log(Stage2.pickaxeStatus);
		Stage2.mainMusic.pause(); // 배경 음악 멈춤
		clearInterval(gameInterval);
		$("#screen #stage2_volume").remove(); // 볼륨 버튼 없애기
		setTimeout(() => {
			//context.clearRect(0, 0, maxWidth, maxHeight); // clear canvas			
		}, 10);
		$(window).off("mousemove");
	},
	failResult: (context) => {
		Stage2.failMusic.play(); // 패배 음악
		$("#stage2-result").css({
			backgroundColor: "rgba(255, 0, 0, 0.253)",
		});
		$("#stage2-result > h1").text("You died!");
		$("#stage2-result > img").attr("src",`resource/pickaxe/${Stage2.pickaxeStatus}_pickaxe.png`);
		$("#stage2-result > p").text("Achieved!");
		Stage2.gameEnd(context);
		moveNext(0);
	},
	successResult: (context) => {
		Stage2.victoryMusic.play(); // 승리 음악
		Stage2.pickaxeStatus = "diamond";
		$("#stage2-result").css({
			backgroundColor: "rgba(102, 255, 0, 0.253)",
		});
		$("#stage2-result > h1").text("You Successed!");
		$("#stage2-result > img").attr("src",`resource/pickaxe/${Stage2.pickaxeStatus}_pickaxe.png`);
		$("#stage2-result > p").text("Achieved!");
		Stage2.gameEnd(context);
		moveNext(0);
	},
	startGame: (currentLevel, callBack) => {
		//isSuccess = false;
		window.fixedDiamondX = undefined;
		window.pickaxe = undefined;
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
		const canvasPosition = $(canvas).position();
	
		const deathLine = maxHeight * 0.96;
	
		const levelInfo = stage2Levels[currentLevel];

		const paddleImg = new Image();
		paddleImg.src = "resource/sprite/paddle_slime.png";
		
		// 배경 음악
		Stage2.mainMusic.volume = 1.0; // 음악 볼륨
		Stage2.mainMusic.play();
		
		// 볼륨 버튼
		const volumeDiv = $("<div />").attr("id", "stage2_volume");
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
			if(volumeOn) {
				volumeOn = false;
				Stage2.mainMusic.volume = 0.0;
				volumeDiv.find("img").attr("src", "resource/sprite/volume_off.png");
			}
			else {
				volumeOn = true;
				Stage2.mainMusic.volume = 1.0;
				volumeDiv.find("img").attr("src", "resource/sprite/volume_on.png");
			}
		});
		$(canvas).parent().append(volumeDiv);
	
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
		const padding = 0;
	
		// object that maps "position" to "id"
		const brickPosInfo = {};
	
		// bar object
		let bar = {
			id: barId,
			color: "brown",
			type: "bar",
			loc: [100 + maxWidth / 2 - levelInfo.barWidth / 2, deathLine - 100],
			size: [levelInfo.barWidth, barHeight],
			sound: [new Audio("resource/sound/slime_paddle_1.ogg"), new Audio("resource/sound/slime_paddle_2.ogg"), new Audio("resource/sound/slime_paddle_3.ogg"), new Audio("resource/sound/slime_paddle_4.ogg")],
		};
	
		draws.push(bar);
	
		if (!window.pickaxe) 
			window.pickaxe = {ore: Ores.WOOD, power: 1};
	
		let ballImage = new Image();
	
		ballImage.src = `resource/pickaxe/wood_pickaxe.png`;
	
		const ball = { 
			id: ballId,
			color: "red", 
			type: "circle", 
			loc: [450, 600], 
			width: 25, 
			image: ballImage, 
			degree: 0,
			sound: [new Audio("resource/sound/brick_break1.mp3"), new Audio("resource/sound/brick_break2.mp3"), new Audio("resource/sound/brick_break3.mp3"), new Audio("resource/sound/brick_break4.mp3")],
		};
	
		// a list that keep tracks the ball's location
		let ballLoc = [450, 600];
	
		draws.push(ball); 
	
		// initial ball shooting radian
		const poassibleRadians = [
			-Math.PI * (1 / 6 + Math.random() / 6),
			-Math.PI * (5 / 6 - Math.random() / 6),
		 ];
		 let ballRad = poassibleRadians[Math.floor(Math.random() * 2)];
	 
	
		if (!window.fixedDiamondX) 
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
				
			if (!window.ores[pos]) {
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
					Stage2.pickaxeStatus = "wood";
					break;
				case Ores.STONE:
					ball.image.src = `resource/items/stone_pickaxe.png`;
					Stage2.pickaxeStatus = "stone";
					break;
				case Ores.IRON:
					ball.image.src = `resource/items/iron_pickaxe.png`;
					Stage2.pickaxeStatus = "iron";
					break;
				case Ores.GOLD:
					ball.image.src = `resource/items/gold_pickaxe.png`;
					Stage2.pickaxeStatus = "gold";
					break;
				case Ores.DIAMOND:
					ball.image.src = `resource/items/diamond_pickaxe.png`;
					Stage2.pickaxeStatus = "diamond";
					break;
			}
			
	
			for (const object of draws) {
				context.beginPath();
				context.strokeStyle = 'black';
				context.fillStyle = 'black';
	
				// when the object is the bar
				if (object.id === barId) {
					object.loc = [
						Math.max(
							0,
							Math.min(
								maxWidth - levelInfo.barWidth, 
								mousePos[0] - mousePadding - levelInfo.barWidth / 2
							)
						),
						object.loc[1],
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
					if ((object.loc[1] <= bar.loc[1] && object.loc[1] >= bar.loc[1] - object.width) &&
						(object.loc[0] >= bar.loc[0] && object.loc[0] <= bar.loc[0] + levelInfo.barWidth)) {
						ballRad = (2 * Math.PI - ballRad);
						bar.sound[Math.floor(Math.random() * bar.sound.length)].play();
					}
					if ((object.loc[1] >= bar.loc[1] && object.loc[1] <= bar.loc[1] + barHeight) &&
						((object.loc[0] >= bar.loc[0] - object.width && object.loc[0] <= bar.loc[0]) || 
						 (object.loc[0] <= bar.loc[0] + levelInfo.barWidth + object.width && object.loc[0] >= bar.loc[0] + levelInfo.barWidth))) {
						ballRad = Math.PI - ballRad; 
						bar.sound[Math.floor(Math.random() * bar.sound.length)].play();
					} 
	
					if (object.loc[1] > deathLine) { 
						//checkResult(context);
						Stage2.sound[0].play();
						Stage2.failResult(context);
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
					case "bar":
						context.drawImage(
							paddleImg,
							0,
							0,
							132,
							36,
							object.loc[0], 
							object.loc[1], 
							object.size[0], 
							object.size[1]
						);
						break;
					case "ore":
						//console.log(window.ores[object.pos]);
							
						const destroyStage = Math.floor(10 - (window.ores[object.pos].health / brickPosInfo[object.pos].ore.oreHealth) * 10);
	
						if (destroyStage > 0 && destroyStage < 10) {
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
					(ballLoc[0] + Math.cos(ballRad) * (ball.width)) / brickAreaWidth
				) % levelInfo.bricks_in_row
			) * brickAreaWidth;
			// limit brick's x position
			brickX = Math.max(0, brickX);
			brickX = Math.min(maxWidth - brickAreaWidth, brickX);
	
			const brickY = Number.parseInt((ballLoc[1] + Math.sin(ballRad) * (ball.width)) / brickAreaHeight) * brickAreaHeight;
	
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
					ball.sound[Math.floor(Math.random() * ball.sound.length)].play();
					// HP calculation
					window.ores[collidePos].health -= window.pickaxe.power;
	
					//check destroys the ore
					if (window.ores[collidePos].health <= 0) {
						window.ores[collidePos].health = 0;
						//change pickaxe material
						if (brickPosInfo[collidePos].ore !== window.pickaxe.ore && 
							brickPosInfo[collidePos].ore.order >= window.pickaxe.ore.order) {
	
							window.pickaxe.ore = brickPosInfo[collidePos].ore;
							window.pickaxe.power = brickPosInfo[collidePos].ore.oreHealth;
							console.log(window.pickaxe.ore);
							console.log(brickPosInfo[collidePos].ore);
						}
						
						//check if breaks diamond => end
						if (brickPosInfo[collidePos].ore === Ores.DIAMOND) {
							//isSuccess = true;
							//checkResult(context);
							Stage2.successResult(context);
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
	
		gameInterval = setInterval(() => draw(gameInterval, Stage2.gameEnd));
	}
}


const stage2Levels = {
	"easy": {
		brick_count: 32,
		bricks_in_row: 8,
		ball_speed: 1,
		barWidth: 250
	},
	"normal": {
		brick_count: 40,
		bricks_in_row: 8,
		ball_speed: 1.5,
		barWidth: 200
	},
	"hard": {
		brick_count: 40,
		bricks_in_row: 8,
		ball_speed: 2.5,
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

	$(".level-btn").on("click", function() {
		if (currentStage === "stage 2") {
			moveNext(1);
			$(window).on("mousemove", event => {
				mousePos = [
					event.pageX,
					event.pageY
				];
			});
			Stage2.stageStatus.isPlaying = true;
			Stage2.startGame($(this).val());
		}
	});

	//??
	$("#stage2 .back").on("click", () => {
		Stage2.stageStatus.isPlaying = false; // 스테이지를 나가면 게임이 끝난 것으로 취급, 아래 코드에서 루프 종료
		const canvas = document.getElementById("myCanvas");
		const context = canvas.getContext("2d");

		Stage2.gameEnd(context);
	});
});

function getRandomOre(info, x, y) {
	if (x == window.fixedDiamondX && y == 0) return Ores.DIAMOND;

	//console.log(x + ", " + y);

	let maxY = info.brick_count / info.bricks_in_row - 1;
	let ores = Object.values(Ores);
	let maxWeight = ores.map(ore => ore.weight).reduce((c, n) => c < n ? n : c);

	let weightenList = [];
	ores.forEach(ore => {
		
		//console.log(ore);
		
		let proportion = Math.ceil(ore.weight / maxWeight * maxY);
		if (proportion >= y)
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