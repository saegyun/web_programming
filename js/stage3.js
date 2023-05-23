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

	$("#choice .next").eq(2).on("click", () => {
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

class Ball {
	constructor(x, y, radius, color, damage, speed) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color;
		this.damage = damage;
		this.speed = speed;
	}
}

class Bar {
	constructor(x, y, width, height, color) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.color = color;
	}
}

class Mob {
	constructor(x, y, health, damage, speed, width, height, maxFrame, frameWidth, exp) {
		this.x = x;
		this.y = y;
		this.health = health;
		this.damage = damage;
		this.speed = speed;
		this.width = width;
		this.height = height;
		this.exp = exp;
		this.status = "";
		this.hitTimer = 0;
		this.currentFrame = 0;
		this.animationTime = 0;
		this.maxFrame = maxFrame;
		this.frameWidth = frameWidth;
	}
}

Mob.prototype.draw = function(context, idleSprite, hurtSprite) {
	let sprite;
	switch(this.status) {
		case "hurt":
			if(this.hitTimer > 0) {
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
	//context.fillRect(this.x, this.y, this.width, this.height);
	context.drawImage(
		sprite, // Image
		this.currentFrame * this.frameWidth, // Source x
		0, // Source y
		this.frameWidth, // Source width
		this.frameWidth, // Source height
		this.x, // Destination x
		this.y, // Destination y
		this.width, // Destination width
		this.height // Destination height
	);
	if(this.animationTime >= 10) {
		this.animationTime = 0;
		this.currentFrame = (this.currentFrame + 1) % this.maxFrame;
	}
	else {
		this.animationTime += 1;
	}
}

Mob.prototype.say = function(idleAudios) {
	if (this.status !== "death") {
		let idleAudio = idleAudios[Math.floor(Math.random() * idleAudios.length)];
		idleAudio.play();
	}
}

Mob.prototype.hit = function(damage, hurtAudios, deathAudios) {
	console.log(this.health + ", " + damage);
	this.health -= damage;
	this.status = "hurt";
	this.hitTimer = 20;
	// make hurt sound
	let hurtAudio = hurtAudios[Math.floor(Math.random() * hurtAudios.length)];
	hurtAudio.play();
	console.log(this.health);
	if(this.health <= 0) // mob is dead
	{
		this.status = "death";
		let deathAudio = deathAudios[Math.floor(Math.random() * deathAudios.length)];
		deathAudio.play();
		// increase exp
		
		return true;
	}
	else
		return false;
}

class MobZombie extends Mob {
	constructor(x, y, health, damage, speed, width, height, exp) {
		super(x, y, health, damage, speed, width, height, 8, 360, exp);
		MobZombie.idleSprite.src = "resource/sprite/zombieIdle.png";
		MobZombie.hurtSprite.src = "resource/sprite/zombieHurt.png";
	}
	static spawnWeight = 25;
	static idleSprite = new Image(); 
	static hurtSprite = new Image();
	static idleAudios = [new Audio("resource/sound/zombieIdle1.mp3"), new Audio("resource/sound/zombieIdle2.mp3"), new Audio("resource/sound/zombieIdle3.mp3")];
	static hurtAudios = [new Audio("resource/sound/zombieHurt1.mp3"), new Audio("resource/sound/zombieHurt2.mp3")];
	static deathAudios = [new Audio("resource/sound/zombieDeath.mp3")];

	draw(context) {
		super.draw(context, MobZombie.idleSprite, MobZombie.hurtSprite);
	}

	say() {
		super.say(MobZombie.idleAudios);
	}

	hit(damage) {
		return super.hit(damage, MobZombie.hurtAudios, MobZombie.deathAudios);
	}
}


class MobSpider extends Mob {
	constructor(x, y, health, damage, speed, width, height, exp) {
		super(x, y, health, damage, speed, width, height, 4, 600, exp);
		MobSpider.idleSprite.src = "resource/sprite/spiderIdle.png";
		MobSpider.hurtSprite.src = "resource/sprite/spiderHurt.png";
	}
	static spawnWeight = 15;
	static idleSprite = new Image();
	static hurtSprite = new Image();
	
	static idleAudios = [new Audio("resource/sound/spiderIdle1.mp3"), new Audio("resource/sound/spiderIdle2.mp3"), new Audio("resource/sound/spiderIdle3.mp3"), new Audio("resource/sound/spiderIdle4.mp3")];
	static hurtAudios = MobSpider.idleAudios;
	static deathAudios = [new Audio("resource/sound/spiderDeath.mp3")];
	
	static frameWidth = 600;
	static frameHeight = 600;
	
	draw(context) {
		super.draw(context, MobSpider.idleSprite, MobSpider.hurtSprite);
	}
	
	say() {
		super.say(MobSpider.idleAudios);
	}
	
	hit(damage) {
		return super.hit(damage, MobSpider.hurtAudios, MobSpider.deathAudios);
	}
}

class MobCreeper extends Mob {
	constructor(x, y, health, damage, speed, width, height, exp) {
		super(x, y, health, damage, speed, width, height, 8, 360, exp);
		MobCreeper.idleSprite.src = "resource/sprite/creeperIdle.png";
		MobCreeper.hurtSprite.src = "resource/sprite/creeperHurt.png";
	}
	static spawnWeight = 10;
	static idleSprite = new Image();
	static hurtSprite = new Image();
	static idleAudios = [new Audio("resource/sound/creeperIdle1.mp3"), new Audio("resource/sound/creeperIdle2.mp3"), new Audio("resource/sound/creeperIdle3.mp3"), new Audio("resource/sound/creeperIdle4.mp3")];
	static hurtAudios = MobCreeper.idleAudios;
	static deathAudios = [new Audio("resource/sound/creeperDeath.mp3")];
	
	draw(context) {
		super.draw(context, MobCreeper.idleSprite, MobCreeper.hurtSprite);
	}
	
	say() {
		super.say(MobCreeper.idleAudios);
	}
	
	hit(damage) {
		return super.hit(damage, MobCreeper.hurtAudios, MobCreeper.deathAudios);
	}
}

// brick breaking main logic
function startGame(callBack) { 
	
	const canvas = document.getElementById("myCanvas");
	const context = canvas.getContext("2d");

	const spawnLineWidthMin = maxWidth * 0.15;
	const spawnLineWidthMax = maxWidth * 0.85;
	const spawnLine = maxHeight * 0.1;
	const deathLine = maxHeight * 0.98;

	const levelInfo = levels[currentLevel];
	let villageHealth = 20;
	const maxSpawns = 10;
	const mobSpawnFrequency = 100;
	const villageHitAudios = [new Audio("resource/sound/villageHit1.mp3"), new Audio("resource/sound/villageHit2.mp3"), new Audio("resource/sound/villageHit3.mp3"), new Audio("resource/sound/villageHit4.mp3")];
	const villageBreakAudios = [new Audio("resource/sound/villageBreak.mp3")];
	
	let activeMobs = [];
	
	function spawnMob() {
		if(activeMobs.length >= maxSpawns)
			return;
		
		const randomInt = Math.floor(Math.random() * mobSpawnFrequency);
		
		let mob = "";
		if(randomInt <= MobCreeper.spawnWeight)
			mob = "creeper";
		else if(randomInt <= MobSpider.spawnWeight)
			mob = "spider";
		else if(randomInt <= MobZombie.spawnWeight)
			mob = "zombie"
		else
			return;
		
		// spawn mob
		const randomSpawnX = Math.floor(Math.random() * (spawnLineWidthMax - spawnLineWidthMin + 1)) + spawnLineWidthMin;
		console.log("x: " + randomSpawnX + " y: " + spawnLine);
		let newMob;
		switch(mob) {
			case "zombie":
				newMob = new MobZombie(
					randomSpawnX,
					spawnLine,
					20,
					2,
					0.15,
					60,
					60,
					10
				);
				newMob.say();
				activeMobs.push(newMob);
				break;
			case "spider":
				newMob = new MobSpider(
					randomSpawnX,
					spawnLine,
					10,
					1,
					0.2,
					90,
					90,
					12
				);
				newMob.say();
				activeMobs.push(newMob);
				break;
			case "creeper":
				newMob = new MobCreeper(
					randomSpawnX,
					spawnLine,
					16,
					4,
					0.15,
					60,
					60,
					20
				);
				newMob.say();
				activeMobs.push(newMob);
				break;
		}
	}
	
	const spawnInterval = setInterval(spawnMob, 1000);
	
	// Checks collision between ball and rect(or mob, image)
	function checkCollision(ball, rect, ballRad) {
		// Temporary variables to set edges for testing
		let testX = ball.x;
		let testY = ball.y;
	
		// Which edge is closest?
		if (ball.x < rect.x) {
			testX = rect.x;       // Test left edge
		} else if (ball.x > rect.x + rect.width) {
			testX = rect.x + rect.width;  // Test right edge
		}
	
		if (ball.y < rect.y) {
			testY = rect.y;       // Test top edge
		} else if (ball.y > rect.y + rect.height) {
			testY = rect.y + rect.height; // Test bottom edge
		}
	
		// Get distance from closest edges
		let distX = ball.x - testX;
		let distY = ball.y - testY;
		let distance = Math.sqrt((distX * distX) + (distY * distY));
	
		// If the distance is less than the radius, collision
		if (distance <= ball.radius) {
			if (testX === rect.x) {
				console.log("Ball collided with rectangle from left");
				return (Math.PI - ballRad);
			}
			if (testX === rect.x + rect.width) {
				console.log("Ball collided with rectangle from right");
				return (Math.PI - ballRad);
			}
			if (testY === rect.y) {
				console.log("Ball collided with rectangle from top");
				return (2 * Math.PI - ballRad); 
			}
			if (testY === rect.y + rect.height) {
				console.log("Ball collided with rectangle from bottom");
				return (2 * Math.PI - ballRad); 
			}
		}
		return 999; // not collided
	}

	const barWidth = 200;
	const barHeight = 20;
	
	// bar object
	let bar = new Bar(100 + maxWidth / 2 - barWidth / 2, deathLine - 100, barWidth, barHeight, "gray");

	// ball object
	let ball = new Ball(450, 600, 10, "cyan", 10, levelInfo.ball_speed + 4);
	
	// initial ball shooting radian
	let ballRad = Math.PI * (Math.random() - 1) / 2;
	
	let gameEnded = false;
	
	// game loop
	function loop() {
		if(!gameEnded)
			requestAnimationFrame(loop);
		else {
			clearInterval(spawnInterval);
			return;
		}
			
		context.clearRect(0, 0, maxWidth, maxHeight);
		
		// move mobs downward
		for(var i in activeMobs) {
			let mob = activeMobs[i];
			mob.y += mob.speed;
			
			if(mob.y > deathLine - 60) {
				// make village break sound
				let villageHitAudio = villageHitAudios[Math.floor(Math.random() * villageHitAudios.length)];
				villageHitAudio.play();
				villageHealth -= mob.damage;
				activeMobs.splice(i, 1);
				
				if(villageHealth <= 0) {
					let villageBreakAudio = villageBreakAudios[Math.floor(Math.random() * villageBreakAudios.length)];
					villageBreakAudio.play();
					
					gameEnded = true;
					break;
				}
				
			}
		}
		
		// prevent bar from going through walls
		bar.x = Math.max(
			0,
			Math.min(
				maxWidth - barWidth, 
				mousePos[0] - mousePadding - barWidth / 2
			)
		);
		
		// ball collision
		// collide with vertical wall
		if (ball.x < ball.radius || ball.x > maxWidth - ball.radius) {
			ballRad = Math.PI - ballRad;
		}
		
		// collide with horizontal wall
		if (ball.y <= ball.radius || ball.y > maxHeight - ball.radius) {
			ballRad = (2 * Math.PI - ballRad);
		}
		
		// collide with bar
		let collideWithBar = checkCollision(ball, bar, ballRad);
		if(collideWithBar != 999) // if collided with bar
			ballRad = collideWithBar;
		
		// collide with mob
		for(var i in activeMobs) {
			let mob = activeMobs[i];
			let collideWithMob = checkCollision(ball, mob, ballRad);
			
			if(collideWithMob != 999) { // if collided with mob
				ballRad = collideWithMob;
				if(mob.hit(ball.damage)) { // if mob is hit and dead
					activeMobs.splice(i, 1);
				}
			}
		}
		
		// refreshing ball's location
		ball.x = ball.x + Math.cos(ballRad) * ball.speed;
		ball.y = ball.y + Math.sin(ballRad) * ball.speed;
		
		if(ball.y > deathLine) {
			console.log("crossed deathLine");
			ball.y = 600;
		}
		
		// drawing objects
		// draw ball
		context.fillStyle = ball.color || "black";
		context.beginPath();
		context.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
		context.closePath();
		context.fill();
		
		// draw bar
		context.fillStyle = bar.color || "black";
		context.fillRect(bar.x, bar.y, bar.width, bar.height);
		
		// draw mobs
		for(var i in activeMobs) {
			let mob = activeMobs[i];
			mob.draw(context);
		}
	}

	const gameEnd = () => {
		context.clearRect(0, 0, maxWidth, maxHeight); // clear canvas
		callBack();
	};

	requestAnimationFrame(loop);
}
