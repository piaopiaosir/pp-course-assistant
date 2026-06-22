import re
import sys
import os

def singlefile_to_html(input_path, output_path=None):
    """
    将 SingleFile 保存的 HTML 转换为普通 HTML。
    SingleFile 格式：整个 HTML 在一行内，所有内容被压缩。
    此脚本将其格式化，并提取 iframe 信息。
    """
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 提取注释中的元信息
    meta_match = re.search(r'<!--\s*Page saved with SingleFile\s*\n(.*?)\n-->', content, re.DOTALL)
    if meta_match:
        print("=== SingleFile 元信息 ===")
        print(meta_match.group(1).strip())
        print()

    # 提取所有 iframe 标签
    iframes = re.findall(r'<iframe[^>]*/?>', content, re.IGNORECASE)
    print(f"=== 找到 {len(iframes)} 个 iframe ===")
    for i, iframe in enumerate(iframes):
        print(f"\n--- iframe {i+1} ---")
        # 提取关键属性
        data_match = re.search(r"data='([^']*)'", iframe)
        if data_match:
            try:
                import json
                data = json.loads(data_match.group(1))
                print(f"  data.objectid: {data.get('objectid', 'N/A')}")
                print(f"  data.jobid: {data.get('jobid', 'N/A')}")
                print(f"  data._jobid: {data.get('_jobid', 'N/A')}")
                print(f"  data.name: {data.get('name', 'N/A')}")
                print(f"  data.type: {data.get('type', 'N/A')}")
            except:
                pass
        # srcdoc前200字符
        srcdoc = re.search(r'srcdoc="([^"]{0,200})', iframe)
        if srcdoc:
            print(f"  srcdoc(前200): {srcdoc.group(1)[:200]}...")
        # 检查是否有 ans-job-icon
        class_match = re.search(r'class="([^"]*)"', iframe)
        if class_match:
            print(f"  class: {class_match.group(1)}")
        print()

    # 提取 ans-job-icon 相关信息
    job_icons = re.findall(r'<[^>]*ans-job-icon[^>]*>', content, re.IGNORECASE)
    print(f"\n=== 找到 {len(job_icons)} 个 ans-job-icon ===")
    for i, icon in enumerate(job_icons):
        aria = re.search(r'aria-label="([^"]*)"', icon)
        print(f"  {i+1}: aria-label={aria.group(1) if aria else '(无)'}")

    # 提取 ans-job-finished 相关信息
    finished = re.findall(r'class="[^"]*ans-job-finished[^"]*"', content)
    print(f"\n=== ans-job-finished class 出现次数: {len(finished)} ===")

    # 输出格式化 HTML
    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = base + '_formatted' + ext

    # 简单格式化：在 > 后添加换行
    formatted = content
    formatted = re.sub(r'(</div>|</li>|</tr>|</table>|</head>|</body>|</html>|</iframe>|/>)', r'\1\n', formatted)
    formatted = re.sub(r'(<div|<li|<tr|<table|<head|<body|<html|<iframe)', r'\n\1', formatted)
    # 压缩多余空行
    formatted = re.sub(r'\n{3,}', '\n\n', formatted)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(formatted)

    print(f"\n格式化 HTML 已保存到: {output_path}")


if __name__ == '__main__':
    input_file = r'f:\Users\PIAOPIAO\CodeBuddy\20260309\乱\学生学习页面 (2026_6_21 21：39：58).html'
    singlefile_to_html(input_file)
