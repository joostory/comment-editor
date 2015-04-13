# comment-editor

comment-editor는 멘션가능한 댓글폼입니다.

## 사용법

	var editor = $("textarea.editor").editor({
		mentions: [
			{userId: 1, userName:"홍길동", userImage:"http://mud-kage.kakao.co.kr/14/dn/btqbJlyNypL/kFOdHKDFNBlBW2VD9Ei00K/o.jpg"},
			{userId: 2, userName:"홍길순", userImage:"http://mud-kage.kakao.co.kr/14/dn/btqbJlyNypL/kFOdHKDFNBlBW2VD9Ei00K/o.jpg"},
			{userId: 3, userName:"홍일점", userImage:"http://mud-kage.kakao.co.kr/14/dn/btqbJlyNypL/kFOdHKDFNBlBW2VD9Ei00K/o.jpg"},
			{userId: 4, userName:"John", userImage:"http://mud-kage.kakao.co.kr/14/dn/btqbJlyNypL/kFOdHKDFNBlBW2VD9Ei00K/o.jpg"},
			{userId: 5, userName:"Jane", userImage:"http://mud-kage.kakao.co.kr/14/dn/btqbJlyNypL/kFOdHKDFNBlBW2VD9Ei00K/o.jpg"}
		]
	});

	editor.addMention({userId: 4, userName:"John", userImage:"http://mud-kage.kakao.co.kr/14/dn/btqbJlyNypL/kFOdHKDFNBlBW2VD9Ei00K/o.jpg"}, true);
	editor.addMention({userId: 5, userName:"Jane", userImage:"http://mud-kage.kakao.co.kr/14/dn/btqbJlyNypL/kFOdHKDFNBlBW2VD9Ei00K/o.jpg"}, true);

	$("#submit").on("click", function() {
		$(".result").text(editor.value());
	});
