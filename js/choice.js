$(document).ready(() => {
	const stageInfo = [
		{
			name: "stage 1",
			description: "나무를 캐 기본 조작을 익혀보세요!",
			preview: "resource/background/preview/stage1.png",
		},
		{
			name: "stage 2",
			description: "광물을 캐 새로운 광물을 사용해보세요!",
			preview: "resource/background/preview/stage2.png",
		},
		{
			name: "stage 3",
			description: "몬스터가 찾아옵니다! 동이 틀 때까지 버티세요!",
			preview: "resource/background/preview/stage3.png",
		},
		{
			name: "stage 4",
			description: "블레이즈 스포너를 찾았습니다! 스포너를 부숴 그들을 막으세요!",
			preview: "resource/background/preview/stage4.png",
		},
		{
			name: "stage 5",
			description: "평화를 깬 엔더드래곤! 복수의 시간입니다!",
			preview: "resource/ui/blank.png",
		}
	]

	$("#enchant").on("click", () => {
		moveNext(5);
	});

	$(".stages").ready(() => {
		currentStage = stageInfo[0].name;
		$("#stage-info > p").eq(0).text(stageInfo[0].name);
		$("#stage-info > p").eq(1).text(stageInfo[0].description);
		$("#stage-info > img").attr("src", stageInfo[0].preview);
	});

	for (let i = 0; i < 5; i++) {
		$(".stages > button").eq(i).on("click", () => {
			currentStage = stageInfo[i].name;
			console.log("select", currentStage);
			$("#stage-info > p").eq(0).text(stageInfo[i].name);
			$("#stage-info > p").eq(1).text(stageInfo[i].description);
			$("#stage-info > img").attr("src", stageInfo[i].preview);
		});
	}
});