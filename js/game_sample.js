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

	//title 화면
	$("#intro .next").on("click", () => {
		$("#ui").css({
				"background-image":"url(img/background.jpg)",
				"background-position":"center"
			});
	});
	$("#setting .back").on("click", () => {
		$("#ui").css({
				"background-image":"url(img/background.jpg)",
				"background-position":"center"
			});
	});
	$("#choice .back").on("click", () => {
		$("#ui").css({
				"background-image":"url(img/background.jpg)",
				"background-position":"center"
			});
	});

	$("#choice .next").eq(4).on("click", () => {
		$("#screen").css({
				"background-image":"url(img/stage5_background.jpg)",
				"background-position":"center"
			});
		$(window).on("mousemove", event => {
			mousePos = [
				event.pageX,
				event.pageY
			];
		});

		stage5_startGame(() => {
			$(window).off("mousemove");
		});
	});
});


function stage5_startGame(callBack){
	const canvas = document.getElementById("myCanvas");
	const context = canvas.getContext("2d");

	const deathLine = maxHeight * 0.98;
	const levelInfo = levels[currentLevel];

	const barWidth = 200;
	const barHeight = 20;

	const bossWidth = 200;
	const bossHeight = 200;

	const crystalWidth = 100;
	const crystalHeight = 100;

	const gifLength = 100;

	
	const skills = [];
	const draws = [];
	const monsters = [];

	// ball id
	const ballId = new Date().getMilliseconds();
	// bar id
	const barId = new Date().getMilliseconds() - 1;
	const bossId = new Date().getMilliseconds() - 2;
	const crystal_1_Id = new Date().getMilliseconds() - 3;
	const crystal_2_Id = new Date().getMilliseconds() - 4;

	const barLife = 5;
	const bossLife = 10;

	let gameON = true;

	let boss = {
		id: bossId,
		type: "img",
		from: [maxWidth / 2 - bossWidth / 2, 30],
		size: [bossWidth, bossHeight],
		life: 10,
		src: "img/ender_dragon_1.gif"
	};

	monsters.push(boss);

	let crystal_1 = {
		id: crystal_1_Id,
		type: "img",
		from: [100, deathLine - 500],
		size: [crystalWidth, crystalHeight],
		life: 3,
		src: "img/end_crystal.gif"
	};
	monsters.push(crystal_1);

	let crystal_2 = {
		id: crystal_2_Id,
		type: "img",
		from: [maxWidth-crystalWidth-100, deathLine - 500],
		size: [crystalWidth, crystalHeight],
		life: 3,
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
		life: 5
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

	draws.push(monsters[0]);
	draws.push(monsters[1]);
	draws.push(monsters[2]);

	// initial ball shooting radian
	let ballRad = Math.PI * (Math.random() - 1) / 4;


	let fireballItv;
	let bossUpItv;
	let flameItv;


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
    	let fireLoc = [Math.floor(Math.random() * (maxWidth - fireSize - (firePadding * 2))),
    	 boss.from[1] + bossHeight + firePadding]

    	img.onload = function fbdraw(){
    		if(fireLoc[1] < (deathLine - fireSize)){
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
    

    for(let i = 0; i < 3; i++){
    	flameImg[i] = document.createElement('img');
    	flameImg[i].src ="img/fire_5.gif";
    	flameX[i] = Math.floor(Math.random() * (maxWidth - flameSize[0] - (flamePadding * 2)));
    	let styles = {
			"position" : "absolute",
			"width" : flameSize[0] + "px",
			"height" : flameSize[1] + "px",
			"top" : flameY + "px",
			"left" : flameX[i] + "px",
			"z-index" : "2"
		};
		Object.assign(flameImg[i].style, styles); 
		document.getElementById('stage5').appendChild(flameImg[i]);
    }

    function drawFlame(){
    	for(let i = 0; i < 3; i++){
    		flameX[i] = Math.floor(Math.random() * (maxWidth - flameSize[0] - (flamePadding * 2)));
    		flameImg[i].style.left = flameX[i] + "px";
    	}
    	flameItv = setTimeout(drawFlame, 5000);
    }
    flameItv = setTimeout(drawFlame, 5000);

	/*
	if((breathX[i] >= bar.from[0] - flameSize[i]/2) && (flameX[i] <= bar.from[0] + barWidth - flameSize[i]/2)){
    		isAttacked = true;
    	}
	*/

	skills.push(fireballItv);
	skills.push(bossUpItv);
	skills.push(flameItv);

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
	let barHeartImg = [];
    let heartSize = 20;
    let heartStyles = {
    	"position" : "absolute",
    	"width" : heartSize+"px",
    	"height" : heartSize+"px",
    	"top" : (maxHeight-30)+"px",
    	"z-index" : "2"
    };

	for(let i = 0; i < barLife; i++){
		barHeartImg[i] = document.createElement('img');
		barHeartImg[i].src ="img/heart.png";
		barHeartImg[i].style.left = (maxWidth/2 - barLife*heartSize/2 + i*30)+ "px";
    	Object.assign(barHeartImg[i].style, heartStyles); 
    	document.getElementById('stage5').appendChild(barHeartImg[i]);
    }

    //bar의 체력이 닳으면 현재 체력 update
	function drawBarLife(){
		let NowHeartNum = bar.life;
		for(let i = NowHeartNum; i < barLife; i++)
			barHeartImg[i].src ="img/heart_none.png";
	}



    /*
    let obj = $('#BossHeart');
	for(let i = 0; i < obj.length; i++)
		obj[i].remove();

	heartImg.setAttribute('id', "BossHeart");

	let NowHeartNum = object.life;
	let heartNum = barLife;

	for(let i = 0; i < NowHeartNum; i++){
		let styles = {
			"position" : "absolute",
			"width" : heartSize+"px",
			"height" : heartSize+"px",
			"top" : "20px",
			"left" : "120px",
			"z-index" : "2"
		};
		Object.assign(heartImg.style, styles); 
		document.getElementById('stage5').appendChild(heartImg);
	}
	heartImg.src = "img/heart_none.png";
	for(let i = NowHeartNum; i < heartNum; i++){
		let styles = {
			"position" : "absolute",
			"width" : heartSize+"px",
			"height" : heartSize+"px",
			"top" : "20px",
			"left" : "120px",
			"z-index" : "2"
		};
		Object.assign(heartImg.style, styles); 
		document.getElementById('stage5').appendChild(heartImg);
    }
    */


	
	
	

	const draw = (interval, callBack) =>{
		context.clearRect(0, 0, maxWidth, maxHeight);
		
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
				}
			}
			else{
				if(document.getElementById(object.id)!=null)
					document.getElementById(object.id).remove();
			}
		}
		if(boss.life == 0){
			clearInterval(interval);
			setTimeout(callBack, 100);
		}
		else if(bar.life == 0){
			clearInterval(interval);
			setTimeout(callBack, 100);
		}

	}

	const gameEnd = () => {
		gameON = false;

		let objList = $('#stage5 img');
		for(let i = 0; i < objList.length; i++)
			objList[i].remove();

		for(let i = 0; i < skills.length; i++){
			clearTimeout(skills[i]);
		}
		for(let i = 0; i < fbintervalList.length; i++){
			cancelAnimationFrame(fbintervalList[i]);
		}
		context.clearRect(0, 0, maxWidth, maxHeight); // clear canvas
		$("#ui").css({
				"background-image":"url(img/background.jpg)",
				"background-position":"center"
			});

		callBack();
	}

	$("#stage5 .back").on("click", () => {
		clearInterval(gameInterval);
		setTimeout(gameEnd, 100);
	});

	const gameInterval = setInterval(() => draw(gameInterval, gameEnd));
	
}
