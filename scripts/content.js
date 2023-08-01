let url;
let selection;
let selectionText;
let selectionTextFragmentUrl;
let selectionRange;
let selectionRangeClientRect;

// tooltip 초기화
const tooltip = document.createElement("div");
tooltip.id = "my-tooltip";
tooltip.style.position = 'absolute';
tooltip.style.top = '0px';
tooltip.style.left = '0px';
tooltip.style.backgroundColor = 'rgba(200, 200, 200, 0.9)';
tooltip.addEventListener("click", annotate);
document.body.appendChild(tooltip);
hideTooltip();

// 버튼 클릭시 발생하는 인터랙션
async function annotate() {
  // console.log(url);
  // console.log(selection.focusNode);
  // console.log(selectionText);
  // console.log(selectionTextFragmentUrl);
  // console.log(selectionRange);
  // console.log(selectionRangeClientRect);
  tooltip.innerHTML = '제보 중...';
  // 추가 고려사항: 반복 클릭 방지, 버튼 디자인 개선

  await callAnnotationAPI(selectionText, selectionTextFragmentUrl);
}

// API 호출
async function callAnnotationAPI(selectionText, targetUrl) {
  const apiUrl = `https://script.google.com/macros/s/AKfycbyRP-5IAyiRhSwzTNtDnaQ9aOcA0g3VAEb9MzxhtfesHajgfpqesv0rt5LWieM5zPRKBg/exec?body=${selectionText}&target=${encodeURIComponent(targetUrl)}`;
  // const req = new Request(apiUrl);
  fetch(apiUrl, {method: 'POST'}).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP 오류! 상태: ${response.status}`);
      }
      tooltip.innerHTML = '제보 완료!';
      setTimeout(hideTooltip, 1000);
      return response.json();
    })
    .then((response) => {
      console.log(response);
    });
}

// 영역 선택에 반응한다
document.addEventListener("selectionchange", () => {
  selection = document.getSelection();
  // 추가 고려사항: disable 기능 
  if (selection.type === "Range") {
    url = document.URL;
    selectionText = selection.toString().trim();

    // https://developer.mozilla.org/en-US/docs/Web/Text_fragments
    // 추가 fail-safe 고려사항: prefix, suffix
    selectionTextFragmentUrl = `${url}#:~:text=${fixedEncodeURIComponent(selectionText)}`;

    selectionRange = selection.getRangeAt(0);
    selectionRangeClientRect = selectionRange.getBoundingClientRect();

    // tooltip.setAttribute('data-selection-text', selectionText);
    tooltip.style.top = `${Math.max(0, window.pageYOffset + selectionRangeClientRect.top - 30)}px`;
    tooltip.style.left = `${Math.max(0, window.pageXOffset + selectionRangeClientRect.left + selectionRangeClientRect.width - 50)}px`;
    tooltip.style.display = 'block';
  } else {
    hideTooltip();
  }
});

function hideTooltip() {
  tooltip.style.display = 'none';
  tooltip.innerHTML = '<button>❔❓❔</button>';
}

// EncodeURIComponent에서 escape되지 않는 일부 문자를 추가로 escape해준다
// 마침표 등을 포함하는 text fragment url이 제대로 작동하기 위해 필요
// https://stackoverflow.com/a/62436236
function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[-_.!~*'()]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}