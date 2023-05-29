const debugObtions = {
	showHitBox: false,
};

// level information
const levels = {
	"easy": {
		brick_intenity: 1,
		brick_count: 40,
		bricks_in_row: 8,
		ball_speed: 5,
		plane_size: 4,
	},
	"normal": {
		brick_intenity: 1,
		brick_count: 40,
		bricks_in_row: 10,
		ball_speed: 1,
		plane_size: 4,
	},
	"hard": {
		brick_intenity: 1,
		brick_count: 40,
		bricks_in_row: 10,
		ball_speed: 1,
		plane_size: 4,
	},
}
let currentLevel = "easy";

// canvas size
const maxWidth = 800;
const maxHeight = 800;

function initPage() {
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

	const flow = {
		"intro": {
			value: intro,
			next: ["title"],
			prev: undefined,
		},
		"title": {
			value: title,
			next: ["choice", "setting"],
			prev: undefined,
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

	let state = "intro";

	const moveNext = (idx) => {
		flow[state].value.hidden = true;
		state = flow[state].next[idx];
		flow[state].value.hidden = false;
		$("#ui").css("background-image","none");
		$("#screen").css("background-image","none");
	};

	const moveBack = () => {
		flow[state].value.hidden = true;
		state = flow[state].prev;
		flow[state].value.hidden = false;
		$("#ui").css("background-image","none");
		$("#screen").css("background-image","none");
	}

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
