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
tooltip.style.background = 'rgba(160, 109, 61, 0.95)';
tooltip.style.borderRadius = '5px';
tooltip.style.border = 'none';
tooltip.style.zIndex = '1000';

const APIButton = document.createElement("button");
APIButton.addEventListener("click", annotate);
APIButton.style.width = '2em';
APIButton.style.height = '2em';
APIButton.style.lineHeight = '0';
APIButton.style.border = 'none';
APIButton.style.color = 'white';
APIButton.style.backgroundColor = 'transparent';
APIButton.style.cursor = 'pointer';
tooltip.appendChild(APIButton);

const CTAButton = document.createElement("a");
CTAButton.href = 'https://datatrust.me';
CTAButton.target = '_blank';
CTAButton.innerHTML = '<button style="width: 2em; height: 2em; line-height: 0; border: none; background-color: transparent; cursor: pointer">ℹ️</button>'
CTAButton.style.backgroundColor = 'transparent';
tooltip.appendChild(CTAButton);

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
  APIButton.removeEventListener("click", annotate);
  // APIButton.disabled = true;
  APIButton.innerHTML = '…';
  // 추가 고려사항: 반복 클릭 방지, 버튼 디자인 개선


  url = document.URL;
  // selectionText = encodeURIComponent(selection.toString().trim());
  selectionText = selection.toString().trim();

  // https://developer.mozilla.org/en-US/docs/Web/Text_fragments
  // 추가 fail-safe 고려사항: prefix, suffix
  selectionTextFragmentUrl = generateTextFragmentUrl(selection);

  // Fallback in case generateTextFragmentUrl returns nothing
  if (!selectionTextFragmentUrl) {
    selectionTextFragmentUrl = `${url}#:~:text=${fixedEncodeURIComponent(selectionText)}`;
  }

  await callAnnotationAPI(selectionText, selectionTextFragmentUrl);
}

// API 호출
async function callAnnotationAPI(selectionText, targetUrl) {
  // const apiUrl = `https://script.google.com/macros/s/AKfycbx1EGLS2PN7FMtD28bctj-MCXBkVsqrsrjrZ2IBBlorTANLidq3NvAxOSNLfIxuiP86MQ/exec?body=${selectionText}&target=${encodeURIComponent(targetUrl)}`;
  const apiUrl = `https://script.google.com/macros/s/AKfycbzykXwuGzldxZQYh1E6C1v_UQuwhoyjSjrAJ-7sbC4WOTFyk6Gbp3HFCX0Dd1G6z-4BuA/exec`;
  // const req = new Request(apiUrl);
  fetch(
    apiUrl, 
    {
      method: 'POST',
      body: JSON.stringify({
        body: selectionText,
        target: targetUrl
      })
    }
    ).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP 오류! 상태: ${response.status}`);
      }
      APIButton.innerHTML = '✅';
      setTimeout(hideTooltip, 1000);
      return response.json();
    })
    .then((response) => {
      console.log(response);
    });
}

// 영역 선택에 반응한다
document.addEventListener("selectionchange", onSelectionChange);

// function onSelectionChange() {
//   selection = document.getSelection();
//   // 추가 고려사항: disable 기능 
//   if (selection.type === "Range") {
//     url = document.URL;
//     selectionText = selection.toString().trim();
//     selectionText = fixedEncodeURIComponent(selectionText);

//     // https://developer.mozilla.org/en-US/docs/Web/Text_fragments
//     // 추가 fail-safe 고려사항: prefix, suffix
//     selectionTextFragmentUrl = `${url}#:~:text=${fixedEncodeURIComponent(selectionText)}`;

//     selectionRange = selection.getRangeAt(0);
//     selectionRangeClientRect = selectionRange.getBoundingClientRect();

//     showTooltip();
//   } else {
//     hideTooltip();
//   }
// }

function onSelectionChange() {
  selection = window.getSelection();
  if (!selection) {
    return;
  }
  // 추가 고려사항: disable 기능 
  if (selection.type === "Range") {
    selectionRange = selection.getRangeAt(0);
    selectionRangeClientRect = selectionRange.getBoundingClientRect();
    showTooltip();
  } else {
    hideTooltip();
  }
}

function showTooltip() {
  tooltip.style.top = `${Math.max(0, window.pageYOffset + selectionRangeClientRect.top - 30)}px`;
  tooltip.style.left = `${Math.max(0, window.pageXOffset + selectionRangeClientRect.left + selectionRangeClientRect.width - 50)}px`;
  tooltip.style.display = 'flex';
}

function hideTooltip() {
  tooltip.style.display = 'none';
  APIButton.innerHTML = '❔';
  APIButton.disabled = false;
  APIButton.addEventListener("click", annotate);
}

// EncodeURIComponent에서 escape되지 않는 일부 문자를 추가로 escape해준다
// 마침표 등을 포함하는 text fragment url이 제대로 작동하기 위해 필요
// https://stackoverflow.com/a/62436236
function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[-_.!~*'()]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

const generateTextFragmentUrl = (selection) => {
  const result = globalThis.generateFragment(selection);

  if (result.status === 0) {
    let fragmentUrl = `${location.origin}${location.pathname}${location.search}`;
    const fragment = result.fragment;
    const prefix = fragment.prefix ?
      `${encodeURIComponent(fragment.prefix)}-,` :
      '';
    const suffix = fragment.suffix ?
      `,-${encodeURIComponent(fragment.suffix)}` :
      '';
    const start = encodeURIComponent(fragment.textStart);
    const end = fragment.textEnd ?
      `,${encodeURIComponent(fragment.textEnd)}` :
      '';
    fragmentUrl += `#:~:text=${prefix}${start}${end}${suffix}`;

    return fragmentUrl;
  }

};