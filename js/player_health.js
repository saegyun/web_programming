class Heart {
	health;
	max_health;

	heart_img;
	heart_bg_img;
	heart_blink_img;

	status;

	sound;

	constructor(health, max_health) {
		this.health = health; 
		this.max_health = max_health;

		this.heart_img = new Image();
		this.heart_img.src = "resource/ui/heart.png";
		
		this.heart_bg_img = new Image();
		this.heart_bg_img.src = "resource/ui/heart_background.png";
		
		this.heart_blink_img = new Image();
		this.heart_blink_img.src = "resource/ui/heart_blink.png";

		this.sound = new Audio("resource/sound/player_hurt.mp3");
	
		this.status = "";
	}

	draw(context, x, y, width, height, padding) {
		for (let i = 0; i <= this.max_health / 2; i++) {
			const drawHeart = (img, ratio) => {
				context.drawImage(
					img,
					0,
					0,
					90 * ratio,
					90,
					x + i * (width + padding),
					y,
					width * ratio,
					height
				);
			}
			drawHeart(this.heart_bg_img, 1);

			if (i <= this.health / 2) {

				drawHeart(this.heart_img, 1);
				if (this.status != "") {
					drawHeart(this.heart_blink_img, 1);
				}
			}
			else if (i == Math.ceil(this.health / 2)) {
				drawHeart(this.heart_img, 0.5);
				if (this.status != "") {
					drawHeart(this.heart_blink_img, 1);
				}
			}
		}
	}

	attack(damage, cb) {
		if (this.status == "") {
			this.health -= damage;
			this.status = "attacked";

			this.sound.play();

			setTimeout(() => {
				this.status = "attacked";
			}, 250);
			setTimeout(() => {
				this.status = "";
			}, 125);
			setTimeout(() => {
				this.status = "attacked";
			}, 370);
			setTimeout(() => {
				this.status = "";
			}, 500);

			if (this.health <= 0) {
				cb();
				return false;
			} else {
				return true;
			}
		} else {
			return true;
		}

	}
}
