let mousePos = [0, 0];
let mousePadding = 0;

$(document).ready(function() {
	const reCalc = () => {
		mousePadding = ($(window).width() - $("#myCanvas").width()) / 2;
	};
	reCalc();

	$(window).on("resize", () => {
		reCalc();
	});

	$("#choice .next").eq(0).on("click", () => {

		$(window).on("mousemove", event => {
			mousePos = [
				event.pageX,
				event.pageY
			];
		});

		startGame(() => {
			$(window).off("mousemove");
		});
	});
});

// brick breaking main logic
function startGame(callBack) {
	
	const canvas = document.getElementById("myCanvas");
	const context = canvas.getContext("2d");

	const deathLine = maxHeight * 0.98;

	const levelInfo = levels[currentLevel];

	// objects to draw 
	// -> will be divided with property "type"
	// -> and identified with property "id"
	const draws = [];

	// ball id
	const ballId = new Date().getMilliseconds();
	// bar id
	const barId = new Date().getMilliseconds() - 1;
	const barWidth = 200;
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
		from: [100 + maxWidth / 2 - barWidth / 2, deathLine - 100],
		size: [barWidth, barHeight],
	};

	draws.push(bar);

	// ball object
	const ball = {
		id: ballId,
		color: "red",
		type: "circle",
		loc: [450, 600],
		radius: 5,
	};

	// a list that keep tracks the ball's location
	let ballLoc = [450, 600];

	draws.push(ball);

	// initial ball shooting radian
	let ballRad = Math.PI * (Math.random() - 1) / 4;

	// add bricks to "draws" and initialize "brickPosInfo"
	for (let i = 0; i < levelInfo.brick_count; i++) {

		const row = Number.parseInt(i / levelInfo.bricks_in_row) * brickAreaHeight;
		const col = (i % levelInfo.bricks_in_row) * brickAreaWidth;
		
		const pos = [col, row];

		brickPosInfo[pos] = new Date().getMilliseconds() + i + 1;

		draws.push({
			id: brickPosInfo[pos],
			color: "rgba(60, 10, 10, 0.5)",
			type: "rect",
			from: [col + padding / 2, row + padding / 2],
			size: [brickAreaWidth - padding, brickAreaHeight - padding],
		});
	}

	// main drawing interval
	const draw = (interval, callBack) => {
		context.clearRect(0, 0, maxWidth, maxHeight);

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
							maxWidth - barWidth, 
							mousePos[0] - mousePadding - barWidth / 2
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
				if (object.loc[0] < object.radius || object.loc[0] > maxWidth - object.radius) {
					ballRad = Math.PI - ballRad;  
				}

				// collide with horizontal wall
				if (object.loc[1] < object.radius || object.loc[1] > maxHeight - object.radius) {
					ballRad = (2 * Math.PI - ballRad);
				}
				
				// refreshing ball's location
				object.loc = [
					object.loc[0] + Math.cos(ballRad) * levelInfo.ball_speed,
					object.loc[1] + Math.sin(ballRad) * levelInfo.ball_speed,
				];

				// collide with bar
				if ((object.loc[1] <= bar.from[1] && object.loc[1] >= bar.from[1] - object.radius) &&
					(object.loc[0] >= bar.from[0] && object.loc[0] <= bar.from[0] + barWidth)) {
					ballRad = (2 * Math.PI - ballRad);
				}
				if ((object.loc[1] >= bar.from[1] && object.loc[1] <= bar.from[1] + barHeight) &&
					((object.loc[0] >= bar.from[0] - object.radius && object.loc[0] <= bar.from[0]) || 
					 (object.loc[0] <= bar.from[0] + barWidth + object.radius && object.loc[0] >= bar.from[0] + barWidth))) {
					ballRad = Math.PI - ballRad;  
				}

				if (object.loc[1] > deathLine) {
					clearInterval(interval);
					setTimeout(callBack, 1000);
				}
			}

			// draw the object according to the its type
			switch(object.type) {
				case "circle":
					context.fillStyle = object.color || "black";
					context.arc(object.loc[0], object.loc[1], object.radius, 0, 2 * Math.PI);
					context.fill();
					break;
				case "rect":
					context.fillStyle = object.color || "black";
					context.fillRect(object.from[0], object.from[1], object.size[0], object.size[1]);
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

		// check if brick really exists
		if (brickPosInfo[[brickX, brickY]]) {
			let isBounced = false;

			// find the real brick object according to its id
			const target = draws.find(v => v.id === brickPosInfo[[brickX, brickY]]);

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

			if (isBounced) {
				draws.splice(draws.indexOf(target), 1);
	
				delete brickPosInfo[[brickX, brickY]];
			}
		}
		// if it's true, show the target brick's hitbox
		if (debugObtions.showHitBox) {
			context.fillStyle = 'rgba(10, 60, 10, 0.5)';

			context.fillRect(brickX + padding / 2, brickY + padding / 2, brickAreaWidth - padding, brickAreaHeight - padding);
			context.fillRect(brickX + padding / 2 - ball.radius, brickY + padding / 2 - ball.radius, brickAreaWidth - padding + ball.radius * 2, brickAreaHeight - padding + ball.radius * 2);	
		}
	}

	const gameEnd = () => {
		context.clearRect(0, 0, maxWidth, maxHeight); // clear canvas
		callBack();
	};

	const gameInterval = setInterval(() => draw(gameInterval, gameEnd));
}
