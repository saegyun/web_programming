let currentStage = "";

// canvas size
const maxWidth = 800;
const maxHeight = 800;

let flow;


let state = "intro";

const moveNext = (idx) => {
	// flow[state].value.hidden = true;
	$(flow[state].value).fadeOut();
	if (flow[state].onUnload) {
		flow[state].onUnload();
	}
	state = flow[state].next[idx];
	
	setTimeout(() => {
		$(flow[state].value).fadeIn();
		if (flow[state].onLoad) {
			flow[state].onLoad();
		}
	}, 500);
	// flow[state].value.hidden = false;
};

const moveBack = () => {
	$(flow[state].value).fadeOut();
	if (flow[state].onUnload) {
		flow[state].onUnload();
	}
	state = flow[state].prev;
	
	setTimeout(() => {
		$(flow[state].value).fadeIn();
		if (flow[state].onLoad) {
			flow[state].onLoad();
		}
	}, 500);
}

function initPage() {

	const canvas = document.getElementById("myCanvas");
	const context = canvas.getContext("2d");

	const titleBgImg = new Image();
	titleBgImg.src = "resource/background/title.png";
	
	const choiceBgImg = new Image();
	choiceBgImg.src = "resource/background/choice.jpg";
	

	const intro = document.getElementById("intro");
	const title = document.getElementById("title");
	const setting = document.getElementById("setting");
	const choice = document.getElementById("choice");
	
	const stage1 = document.getElementById("stage1");
	const stage2 = document.getElementById("stage2");
	const stage3 = document.getElementById("stage3");
	const stage4 = document.getElementById("stage4");
	const stage5 = document.getElementById("stage5");

	const stage1_result = document.getElementById("stage1-result");
	const stage2_result = document.getElementById("stage2-result");
	const stage3_result = document.getElementById("stage3-result");
	const stage4_result = document.getElementById("stage4-result");
	const stage5_result = document.getElementById("stage5-result");

	flow = {
		"intro": {
			value: intro,
			next: ["title"],
			prev: undefined,
		},
		"title": {
			value: title,
			next: ["choice", "setting"],
			prev: undefined,
			onLoad: () => {
				context.drawImage(
					titleBgImg,
					0,
					0,
					1084,
					1080,
					0,
					0,
					maxWidth,
					maxHeight
				);

			},
			onUnload: () => {
				context.clearRect(0, 0, maxWidth, maxHeight);
			}
		},
		"setting": {
			value: setting,
			next: [],
			prev: "title",
		},
		"choice": {
			value: choice,
			next: [
				"stage1",
				"stage2",
				"stage3",
				"stage4",
				"stage5",
			],
			prev: "title",
			onLoad: () => {

				context.drawImage(
					choiceBgImg,
					0,
					0,
					971,
					971,
					0,
					0,
					maxWidth,
					maxHeight
				);

			},
			onUnload: () => {
				context.clearRect(0, 0, maxWidth, maxHeight);
			}
		},
		"stage1": {
			value: stage1,
			next: ["stage1-result"],
			prev: "choice",
		},
		"stage1-result": {
			value: stage1_result,
			next: [],
			prev: "choice",
		},
		"stage2": {
			value: stage2,
			next: ["stage2-result"],
			prev: "choice",
		},
		"stage2-result": {
			value: stage2_result,
			next: [],
			prev: "choice",
		},
		"stage3": {
			value: stage3,
			next: ["stage3-result"],
			prev: "choice",
		},
		"stage3-result": {
			value: stage3_result,
			next: [],
			prev: "choice",
		},
		"stage4": {
			value: stage4,
			next: ["stage4-result"],
			prev: "choice",
		},
		"stage4-result": {
			value: stage4_result,
			next: [],
			prev: "choice",
		},
		"stage5": {
			value: stage5,
			next: ["stage5-result"],
			prev: "choice",
		},
		"stage5-result": {
			value: stage5_result,
			next: [],
			prev: "choice",
		},
	};

	Object.entries(flow).forEach((page) => {
		if (page[0] != state) {
			page[1].value.hidden = true;
		}
	});

	$(".back").on("click", moveBack);

	$("#intro .next").on("click", () => moveNext(0));
	
	$("#title .next").eq(0).on("click", () => moveNext(0));
	$("#title .next").eq(1).on("click", () => moveNext(1));

	for (let i = 0; i < flow["choice"].next.length; i++) {
		$("#choice .next").eq(i).on("click", () => moveNext(i));
	}
}

$(document).ready(() => {	
	initPage();
});
