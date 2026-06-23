// HTML属性转义函数（防XSS）
function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// JS模板字符串转义（防止数据库中的反引号、${}、</script>等破坏外层模板语法）
function escapeJsTemplate(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, () => '\\$')
    .replace(/<\//g, '<\\/');  // 防止 </script> 提前关闭 script 标签
}

module.exports = { escapeAttr, escapeJsTemplate };
