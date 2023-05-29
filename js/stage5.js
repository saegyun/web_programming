$(document).ready(function() {
	const reCalc = () => {
		mousePadding = ($(window).width() - $("#myCanvas").width()) / 2;
	};
	reCalc();

	$(window).on("resize", () => {
		reCalc();
	});

	$(".level-btn").on("click", function() {
		if (currentStage === "stage 5") {
			moveNext(4);
			$(window).on("mousemove", event => {
				mousePos = [
					event.pageX,
					event.pageY
				];
			});

			let video = document.createElement("VIDEO");
			video.src = "img/Stage5.mp4";
			video.style.width = maxHeight + "px"
			video.style.height = maxHeight + "px";
			video.style.backgroundColor = "black";

			document.getElementById('stage5').appendChild(video);
			video.play();

			setTimeout(()=>{
				$('#stage5 video').remove();
				stage5_startGame($(this).val(), () => {
					$(window).off("mousemove");
				});
			} ,16000);
		}
	});

	$("#stage5 .back").on("click", () => {
		console.log("back button for stage5 pressed");
	});
});

// level information
const stage5Levels = {
	"easy": {
		brick_intenity: 1,
		brick_count: 40,
		bricks_in_row: 8,
		ball_speed: 3,
		plane_size: 4,
		barLife: 5,
		bossLife: 10,
		crystalLife: 5
	},
	"normal": {
		brick_intenity: 1,
		brick_count: 40,
		bricks_in_row: 10,
		ball_speed: 3,
		plane_size: 4,
		barLife: 5,
		bossLife: 15,
		crystalLife: 7
	},
	"hard": {
		brick_intenity: 1,
		brick_count: 40,
		bricks_in_row: 10,
		ball_speed: 5,
		plane_size: 4,
		barLife: 3,
		bossLife: 15,
		crystalLife: 7
	},
}

function stage5_startGame(currentLevel, callBack){
	const canvas = document.getElementById("myCanvas");
	const context = canvas.getContext("2d");

	const deathLine = maxHeight * 0.98;
	const levelInfo = stage5Levels[currentLevel];

	const barWidth = 180;
	const barHeight = 20;

	const bossWidth = 200;
	const bossHeight = 200;

	const crystalWidth = 100;
	const crystalHeight = 100;

	const gifLength = 100;

	const backgroundImg = new Image();
	backgroundImg.src = "img/stage5_background.jpg";

	const skills = [];
	const draws = [];
	const monsters = [];

	const stage5_maxWidth = 1000;

	// ball id
	const ballId = new Date().getMilliseconds();
	// bar id
	const barId = new Date().getMilliseconds() - 1;
	const bossId = new Date().getMilliseconds() - 2;
	const crystal_1_Id = new Date().getMilliseconds() - 3;
	const crystal_2_Id = new Date().getMilliseconds() - 4;

	const barLife = levelInfo.barLife;
	const bossLife = levelInfo.bossLife;
	const crystalLife = levelInfo.crystalLife;

	let gameON = true;
	let gameWin = false;

	let boss = {
		id: bossId,
		type: "img",
		from: [stage5_maxWidth / 2 - bossWidth / 2, 30],
		size: [bossWidth, bossHeight],
		life: bossLife,
		src: "img/ender_dragon_1.gif"
	};

	monsters.push(boss);

	let crystal_1 = {
		id: crystal_1_Id,
		type: "img",
		from: [100, deathLine - 500],
		size: [crystalWidth, crystalHeight],
		life: crystalLife,
		src: "img/end_crystal.gif"
	};
	monsters.push(crystal_1);

	let crystal_2 = {
		id: crystal_2_Id,
		type: "img",
		from: [stage5_maxWidth-crystalWidth-100, deathLine - 500],
		size: [crystalWidth, crystalHeight],
		life: crystalLife,
		src: "img/end_crystal.gif"
	};
	monsters.push(crystal_2);

	// bar object
	let bar = {
		id: barId,
		color: "brown",
		type: "rect",
		from: [100 + maxWidth / 2 - barWidth / 2, deathLine - 100],
		size: [barWidth, barHeight],
		life: barLife
	};

	draws.push(bar);

	// ball object
	const ball = {
		id: ballId,
		color: "red",
		type: "circle",
		loc: [450, 600],
		radius: 7,
	};

	// a list that keep tracks the ball's location
	let ballLoc = [450, 600];

	draws.push(ball);

	draws.push(monsters[0]);
	draws.push(monsters[1]);
	draws.push(monsters[2]);

	// initial ball shooting radian
	let ballRad = Math.PI * (Math.random() - 1) / 4;


	let fireballItv;
	let bossUpItv;
	let flameItv;
	let breathItv;


	//보스 체력회복 스킬
	function bossUp(){
		if(boss.life < bossLife)
			boss.life++;
		if(crystal_1.life == 0 && crystal_2.life == 0)
			clearInterval(bossUpItv);
		else
			bossUpItv = setTimeout(bossUp, 5000);
	}
	bossUpItv = setTimeout(bossUp, 5000);


	//fire ball skill
	let fbintervalList = [];
	let fbinterval;
	function fireball() {
		let img = new Image();
    	img.src ="img/fire_3.gif";

    	//랜덤한 x좌표
    	let fireSize = 50;
    	let firePadding = 10;
    	let fireLoc = [Math.floor(Math.random() * (stage5_maxWidth - fireSize - (firePadding * 2))),
    	 boss.from[1] + bossHeight + firePadding]

    	img.onload = function fbdraw(){
    		if(gameON && (fireLoc[1] < (deathLine - fireSize))){
    			context.drawImage(img, fireLoc[0], fireLoc[1], fireSize, fireSize);
    			fireLoc[1]++;

    			fbinterval = requestAnimationFrame(fbdraw);
    			fbintervalList.push(fbinterval);

    			if((fireLoc[0] >= bar.from[0] - fireSize/2 && fireLoc[0] <= bar.from[0] + barWidth + fireSize/2)
    				&&(fireLoc[1] + fireSize >= bar.from[1] && fireLoc[1] + fireSize <= bar.from[1] + barHeight))
    			{
    				bar.life--;
    				drawBarLife();
    				cancelAnimationFrame(fbinterval);
    			}
    		}
    	}
    	if(gameON){
    		fireballItv = setTimeout(fireball, 2000);
    	}
    }
    fireballItv = setTimeout(fireball, 2000);
    

    //flame 스킬
    const flameSize = [barWidth/2, barWidth/4];
    const flamePadding = 10;
    let isAttacked = false;

    let flameX = [];
    const flameY = bar.from[1] - flameSize[1] + 30;

    let flameImg = [];
    

    let styles = {
		"position" : "absolute",
		"width" : flameSize[0] + "px",
		"height" : flameSize[1] + "px",
		"top" : flameY + "px",
		"z-index" : "2"
	};

    for(let i = 0; i < 3; i++){
    	flameImg[i] = document.createElement("img");
		Object.assign(flameImg[i].style, styles); 
		document.getElementById('stage5').appendChild(flameImg[i]);
    }

    function drawFlame(){
    	for(let i = 0; i < 3; i++){
    		flameX[i] = Math.floor(Math.random() * (maxWidth - flameSize[0]) + 100);
    		flameImg[i].style.left = flameX[i] + "px";
    		flameImg[i].src ="img/warning.png";
    	}
    	setTimeout(()=>{
    		isAttacked = false;
    		for(let i = 0; i < 3; i++){
    			flameImg[i].src ="img/fire_5.gif";
    			if((flameX[i] >= bar.from[0] - flameSize[0]/2)
    				&& (flameX[i] <= bar.from[0] + barWidth - flameSize[0]/2))
    				{
    					isAttacked = true;
    				}
    		}
    		if(isAttacked){
    			bar.life--;
    			drawBarLife();
    		}
    	}, 3000);
    	
    	flameItv = setTimeout(drawFlame, 6000);
    }
    flameItv = setTimeout(drawFlame);

    //breath 스킬 반드시 생명 하나 깎임
    function breath(){
    	if(bar.life > 0 && boss.life > 0){
    		let breathImg = document.createElement("img");
    		breathImg.src = "img/explosion.gif";

    		let styles = {
				"position" : "absolute",
				"width" : stage5_maxWidth + "px",
				"height" : maxHeight + "px",
				"left" : "0px",
				"top" :"0px",
				"z-index" : "2"
			};

			Object.assign(breathImg.style, styles); 
			document.getElementById('stage5').appendChild(breathImg);
			setTimeout(()=>{
				breathImg.remove();
				bar.life--;
				drawBarLife();
				breathItv = setTimeout(breath, 10000);
			}, 1000);
			
    	}
    }
    breathItv = setTimeout(breath, 10000);

	skills.push(fireballItv);
	skills.push(bossUpItv);
	skills.push(flameItv);
	skills.push(breathItv);

	function drawMonsterImg(object){
		const monsterImg = document.createElement('img');
		monsterImg.src = object.src;
		monsterImg.setAttribute('id', object.id);
		let styles = {
			"position" : "absolute",
			"width" : object.size[0] + "px",
			"height" : object.size[1] + "px",
			"top" : object.from[1] + "px",
			"left" : object.from[0] + "px",
			"z-index" : "2"
		};
		Object.assign(monsterImg.style, styles); 
		document.getElementById('stage5').appendChild(monsterImg);
	}

	for (let i = 0; i < monsters.length; i++){
		drawMonsterImg(monsters[i]);
	}


	//생명 출력
    let heartSize = 20;
    let heartStyles = {
    	"position" : "absolute",
    	"width" : heartSize+"px",
    	"height" : heartSize+"px",
    	"z-index" : "2"
    };

    let barHeartImg = [];
	for(let i = 0; i < barLife; i++){
		barHeartImg[i] = document.createElement('img');
		barHeartImg[i].src ="img/heart.png";
		barHeartImg[i].style.top = (maxHeight-30)+"px";
		barHeartImg[i].style.left = (stage5_maxWidth/2 - barLife*heartSize/2 + i*30)+ "px";

    	Object.assign(barHeartImg[i].style, heartStyles); 
    	document.getElementById('stage5').appendChild(barHeartImg[i]);
    }

    //bar의 체력이 닳으면 현재 체력 update
	function drawBarLife(){
		if(bar.life > 0){
			let NowHeartNum = bar.life;
			for(let i = NowHeartNum; i < barLife; i++)
				barHeartImg[i].src ="img/heart_none.png";
		}
	}


	let bossHeartImg = [];
	for(let i = 0; i < bossLife; i++){
		bossHeartImg[i] = document.createElement('img');
		bossHeartImg[i].src ="img/heart.png";
		bossHeartImg[i].style.top = "20px";
		bossHeartImg[i].style.left = (stage5_maxWidth/2 - bossLife*heartSize/2 + i*30)+ "px";

    	Object.assign(bossHeartImg[i].style, heartStyles); 
    	document.getElementById('stage5').appendChild(bossHeartImg[i]);
    }

    //boss의 체력이 닳으면 현재 체력 update
	function drawBossLife(){
		if (boss.life > 0) {
			let NowHeartNum = boss.life;
			for(let i = NowHeartNum; i < bossLife; i++)
				bossHeartImg[i].src ="img/heart_none.png";
		}
		
	}


	const draw = (interval, callBack) =>{
		context.clearRect(0, 0, maxWidth, maxHeight);
		context.drawImage(
			backgroundImg,
			200,
			0,
			580 + 200,
			580,
			0,
			0,
			maxWidth,
			maxHeight
		);

		// main drawing interval
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
				if (object.loc[1] < object.radius) {
					ballRad = (2 * Math.PI - ballRad);
				}
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
					bar.life--;
					drawBarLife();
					if(bar.life == 0){
						clearInterval(interval);
						setTimeout(callBack, 100);
					}else{
						ballRad = Math.PI * (Math.random() - 1) / 4;
						object.loc = [450, 600];
					}
				}

				// refreshing ball's location
				object.loc = [
					object.loc[0] + Math.cos(ballRad) * levelInfo.ball_speed,
					object.loc[1] + Math.sin(ballRad) * levelInfo.ball_speed,
				];
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

		for (const object of monsters){
			if((object.life > 0) && gameON){
				let isBounced = false;
				
				if ((ball.loc[1] <= object.from[1] && ball.loc[1] >= object.from[1] - ball.radius) &&
					(ball.loc[0] >= object.from[0] && ball.loc[0] <= object.from[0] + object.size[0])) {
					ballRad = (2 * Math.PI - ballRad);
					isBounced = true;
				}
				if ((ball.loc[1] >= object.from[1] && ball.loc[1] <= object.from[1] + object.size[1]) &&
					((ball.loc[0] >= object.from[0] - ball.radius && ball.loc[0] <= object.from[0]) || 
					(ball.loc[0] <= object.from[0] + object.size[0] + ball.radius && ball.loc[0] >= object.from[0] + object.size[0]))) {
					ballRad = Math.PI - ballRad;  
					isBounced = true;
				}
				if(isBounced){
					object.life--;
					if(object.id == bossId)
						drawBossLife();
				}
			}
			else{
				if(document.getElementById(object.id))
					document.getElementById(object.id).remove();
			}
		}
		if(boss.life == 0){
			gameWin = true;
			clearInterval(interval);
			setTimeout(callBack, 100);
		}
		else if(bar.life == 0){
			gameWin = false;
			clearInterval(interval);
			setTimeout(callBack, 100);
		}

	}

	const gameEnd = () => {
		gameON = false;

		let objList = $('#stage5 img');
		for(let i = 0; i < objList.length; i++)
			objList[i].remove();

		for(let i = 0; i < skills.length; i++)
			clearTimeout(skills[i]);
		
		for(let i = 0; i < fbintervalList.length; i++)
			cancelAnimationFrame(fbintervalList[i]);
		
		context.clearRect(0, 0, maxWidth, maxHeight);

		callBack();

		moveNext(0);
		if(gameWin){ //게임 클리어
			let gameOver = document.createElement("p");
			gameOver.value = "GAME CLEAR";
			document.getElementById('stage5-result').appendChild(gameOver);
		}else{ //stage5 게임 오버
			let gameOver = document.createElement("p");
			gameOver.value = "GAME OVER";
			document.getElementById('stage5-result').appendChild(gameOver);
		}
		
	}

	$("#stage5 .back").on("click", () => {
		clearInterval(gameInterval);
		setTimeout(gameEnd);
	});

	const gameInterval = setInterval(() => draw(gameInterval, gameEnd));
	
}
