// Custom Mermaid Theme Override
document.addEventListener('DOMContentLoaded', function() {
  // 색상 문자열을 RGB로 파싱
  function parseColor(color) {
    if (!color) return null;

    // hex 형식 (#fff, #ffffff)
    if (color.charAt(0) === '#') {
      var hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
      }
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }

    // rgb/rgba 형식
    if (color.indexOf('rgb') === 0) {
      var parts = color.replace(/[^\d,]/g, '').split(',');
      if (parts.length >= 3) {
        return {
          r: parseInt(parts[0], 10),
          g: parseInt(parts[1], 10),
          b: parseInt(parts[2], 10)
        };
      }
    }

    return null;
  }

  // RGB 밝기 계산 (0-255)
  function getColorBrightness(color) {
    var rgb = parseColor(color);
    if (!rgb) return 128;
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  }

  // 노드 배경색에 따라 텍스트 색상 조절
  function adjustTextColorByBackground() {
    var nodes = document.querySelectorAll('.mermaid svg .node, .mermaid svg .cluster');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var shape = node.querySelector('rect, polygon, circle, ellipse, path');
      if (!shape) continue;

      var fill = shape.getAttribute('fill') || window.getComputedStyle(shape).fill;
      var brightness = getColorBrightness(fill);
      var textColor = brightness > 128 ? '#1a1a1a' : '#ffffff';

      var texts = node.querySelectorAll('text, .nodeLabel, .label span, foreignObject div');
      for (var j = 0; j < texts.length; j++) {
        texts[j].style.setProperty('fill', textColor, 'important');
        texts[j].style.setProperty('color', textColor, 'important');
      }
    }
  }

  // Wait for Mermaid to be available
  var checkMermaid = setInterval(function() {
    if (typeof mermaid !== 'undefined') {
      clearInterval(checkMermaid);

      // Get current theme mode
      var isDark = document.documentElement.getAttribute('data-mode') === 'dark';
      var theme = isDark ? 'dark' : 'neutral';

      // Re-initialize with custom theme
      mermaid.initialize({
        startOnLoad: false,
        theme: theme
      });

      // Re-render all mermaid diagrams
      var diagrams = document.querySelectorAll('.mermaid');
      for (var i = 0; i < diagrams.length; i++) {
        var el = diagrams[i];
        var code = el.textContent || el.innerText;
        el.removeAttribute('data-processed');
        el.innerHTML = code;
      }
      mermaid.init(undefined, '.mermaid');

      // 렌더링 후 텍스트 색상 조절
      setTimeout(adjustTextColorByBackground, 500);

      // Listen for theme changes
      var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].attributeName === 'data-mode') {
            var newIsDark = document.documentElement.getAttribute('data-mode') === 'dark';
            var newTheme = newIsDark ? 'dark' : 'neutral';

            mermaid.initialize({ startOnLoad: false, theme: newTheme });
            var els = document.querySelectorAll('.mermaid');
            for (var j = 0; j < els.length; j++) {
              var el = els[j];
              var svg = el.querySelector('svg');
              if (svg) {
                var code = el.getAttribute('data-original-code') || el.textContent;
                el.setAttribute('data-original-code', code);
                el.removeAttribute('data-processed');
                el.innerHTML = code;
              }
            }
            mermaid.init(undefined, '.mermaid');

            // 테마 변경 후 텍스트 색상 재조절
            setTimeout(adjustTextColorByBackground, 500);
          }
        }
      });

      observer.observe(document.documentElement, { attributes: true });
    }
  }, 100);
});
