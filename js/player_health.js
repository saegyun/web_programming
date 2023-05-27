class Heart {
	health;
	max_health;

	heart_img;
	heart_bg_img;
	heart_blink_img;

	status;

	constructor(health, max_health) {
		this.health = health; 
		this.max_health = max_health;

		this.heart_img = new Image();
		this.heart_img.src = "/resource/ui/heart.png";
		
		this.heart_bg_img = new Image();
		this.heart_bg_img.src = "/resource/ui/heart_background.png";
		
		this.heart_blink_img = new Image();
		this.heart_blink_img.src = "/resource/ui/heart_blink.png";
	
		this.status = "";
	}

	draw(context, x, y, width, height, padding) {
		for (let i = 0; i <= this.max_health / 2; i++) {
			context.drawImage(
				this.heart_bg_img,
				0,
				0,
				90,
				90,
				x + i * (width + padding),
				y,
				width,
				height
			);
			if (i <= this.health / 2) {
				context.drawImage(
					this.heart_img,
					0,
					0,
					90,
					90,
					x + i * (width + padding),
					y,
					width,
					height
				);
				if (this.status != "") {
					context.drawImage(
						this.heart_blink_img,
						0,
						0,
						90,
						90,
						x + i * (width + padding),
						y,
						width,
						height
					);
				}
			}
			else if (i == Math.ceil(this.health / 2)) {
				context.drawImage(
					this.heart_img,
					0,
					0,
					45,
					90,
					x + i * (width + padding),
					y,
					width / 2,
					height
				);
				if (this.status != "") {
					context.drawImage(
						this.heart_blink_img,
						0,
						0,
						45,
						90,
						x + i * (width + padding),
						y,
						width / 2,
						height
					);
				}
			}
		}
	}

	attack(damage) {
		if (this.status == "") {
			
			this.health -= damage;
			this.status = "attacked";
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
				return false;
			} else {
				return true;
			}
		} else {
			return true;
		}

	}
}
