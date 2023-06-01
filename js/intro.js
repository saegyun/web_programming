$(document).ready(() => {
	let interacted = false;
    $("*").on("click", function () {
		if ($(this)[0] === $("#intro > button")[0]) {
			console.log("Intro Skipped");
			interacted = true;
			return;
		}
		if (interacted) {
			return;
		}
		introMusic.play(); // intro music start
		interacted = true;
		const $introText = $('.intro-text');

		let texts = [
			"여기, 숲의 속삭임과 강의 노래, 광산의 보물이 어우러진 평화로운 성이 있었다. 그 이름은 실버우드 성이라 불렸다.",
			"숲에서는 사람들이 산책하며 마음을 가다듬었고, 동물들과 친구가 되어 노는 장면이 끊이지 않았다.",
			"강은 성을 둘러싸며 자유로운 물결을 이루었다. 맑고 투명한 물은 마음을 씻어주는 듯한 효과를 주었다. ",
			"광산은 성의 보물의 공간이었다. 이곳에서는 귀중한 광물과 보석이 발굴되었다. ",
			"실버우드 성은 평화와 사랑이 넘치는 곳이었다. ",
			"사람들은 서로를 존중하고 도우며 살았고, 성안에서는 웃음과 행복이 끊이지 않았다. ",
			"그러나 어느 날, 어둠의 세력이 그 평화를 위협하기 시작했다. 엔더드래곤, 그 자칭 용의 왕이 나타났다. ", 
			"그는 악의 힘으로 빛을 가린 채, 실버우드 성을 어둠으로 뒤덮었다.성안의 주민들은 공포에 휩싸이며 모두 자신의 안전을 위해 도망쳐 성을 떠났다.", 
			"스티브는 실버우드 성의 용감한 모험가였다. 그는 성을 되찾기 위해 모험을 떠나기로 한다.",
			"숲이 속삭임과 강의 노래가 그의 귀에 맴돌았고, 광산에서 얻은 보물들이 그의 무기가 될 것이다."];
		let page = 0;

		$introText.text(texts[page]);

		const nextPg = (cb) => {
			if (page >= texts.length - 1) {
				if (cb) {
					cb();
				}
				moveNext(0);
				return;
			}
			let ding = new Audio("resource/sound/experience.ogg");
			ding.volume = 0.5;
			ding.play();
			if ($introText.is('.end')) return;

			if (page === 5) {
				$(".intro-image").css('background-image', 'url("resource/bg/intro2.jpg")');
			}
			//console.log(page);
			//console.log(texts[page]);
			$introText.text(texts[++page]);
		};

		const id = setInterval(() => {
			nextPg(() => {
				clearInterval(id);
			});
		}, 4000);

		$("#intro > button").on("click", () => {
			clearInterval(id);
		});

		$introText.on('click', function() {
			nextPg(() => {
				clearInterval(id);
			});
		});
	})
});


