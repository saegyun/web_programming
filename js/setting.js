$(document).ready(() => {
	const colors = ["black", "white", "gray"];
	const volumes = [0, 0.5, 1.0];

	for (let i = 0; i < 3; i++) {
		$("#setting-bg > button").eq(i).click(() => {
			$("body").css({
				"background-color": colors[i],
			});
		});
	}

	$("#setting-record > button").eq(0).click(() => {
		localStorage.setItem("record", JSON.stringify(PlayStatus));
	});
	$("#setting-record > button").eq(1).click(() => {
		if (localStorage.getItem("record")) {
			localStorage.removeItem("record");
		}
	});
	for (let i = 0; i < 3; i++) {
		$("#setting-audio > button").eq(i).click(() => {
			monsterVolume = volumes[i];
			$("#setting > p").eq(2).text(`Monster Sound (${Math.round(monsterVolume * 100)} %)`);
		});
	}
	$("#setting-music-toggle").click(() => {
		if($("#setting-music-toggle").val() == "off") {
			menuMusic.volume = 0.0;
			$("#setting-music-toggle").val("on");
			$("#setting-music-toggle").text("Turn On");
		} else {
			menuMusic.volume = 1.0;
			$("#setting-music-toggle").val("off");
			$("#setting-music-toggle").text("Turn Off");
		}
	});
});