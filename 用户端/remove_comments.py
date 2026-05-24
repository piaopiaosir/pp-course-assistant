import re

def remove_comments_from_js(input_file, output_file):
    """
    移除JS文件中的注释，保留油猴声明
    """
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 保存油猴头部声明 (从 // ==UserScript== 到 // ==/UserScript==)
    userscript_pattern = r'(// ==UserScript==.*?// ==/UserScript==)'
    userscript_match = re.search(userscript_pattern, content, re.DOTALL)
    userscript_header = userscript_match.group(1) if userscript_match else ''
    
    # 移除油猴头部后的内容
    if userscript_match:
        content_after_header = content[userscript_match.end():]
    else:
        content_after_header = content
    
    def remove_comments(code):
        result = []
        i = 0
        length = len(code)
        
        while i < length:
            char = code[i]
            
            # 处理字符串 "..."
            if char == '"':
                result.append(char)
                i += 1
                while i < length:
                    if code[i] == '\\' and i + 1 < length:
                        result.append(code[i])
                        result.append(code[i + 1])
                        i += 2
                    elif code[i] == '"':
                        result.append(code[i])
                        i += 1
                        break
                    else:
                        result.append(code[i])
                        i += 1
                continue
            
            # 处理字符串 '...'
            if char == "'":
                result.append(char)
                i += 1
                while i < length:
                    if code[i] == '\\' and i + 1 < length:
                        result.append(code[i])
                        result.append(code[i + 1])
                        i += 2
                    elif code[i] == "'":
                        result.append(code[i])
                        i += 1
                        break
                    else:
                        result.append(code[i])
                        i += 1
                continue
            
            # 处理模板字符串 `...`
            if char == '`':
                result.append(char)
                i += 1
                while i < length:
                    if code[i] == '\\' and i + 1 < length:
                        result.append(code[i])
                        result.append(code[i + 1])
                        i += 2
                    elif code[i] == '`':
                        result.append(code[i])
                        i += 1
                        break
                    elif code[i] == '$' and i + 1 < length and code[i + 1] == '{':
                        # 处理模板字符串中的 ${...}
                        result.append(code[i])
                        result.append(code[i + 1])
                        i += 2
                        brace_count = 1
                        while i < length and brace_count > 0:
                            if code[i] == '{':
                                brace_count += 1
                            elif code[i] == '}':
                                brace_count -= 1
                            result.append(code[i])
                            i += 1
                    else:
                        result.append(code[i])
                        i += 1
                continue
            
            # 处理正则表达式 /.../
            # 正则表达式判断：前面是 = ( , [ : ! & | ? { } ; 或者行首
            if char == '/' and i + 1 < length and code[i + 1] not in '/*':
                # 检查是否是正则表达式
                prev_non_space = ''.join(result).rstrip()
                if prev_non_space and prev_non_space[-1] in '=([:!|&?{;}':
                    result.append(char)
                    i += 1
                    in_char_class = False
                    while i < length:
                        if code[i] == '\\' and i + 1 < length:
                            result.append(code[i])
                            result.append(code[i + 1])
                            i += 2
                        elif code[i] == '[':
                            in_char_class = True
                            result.append(code[i])
                            i += 1
                        elif code[i] == ']':
                            in_char_class = False
                            result.append(code[i])
                            i += 1
                        elif code[i] == '/' and not in_char_class:
                            result.append(code[i])
                            i += 1
                            # 处理正则标志
                            while i < length and code[i] in 'gimsuy':
                                result.append(code[i])
                                i += 1
                            break
                        else:
                            result.append(code[i])
                            i += 1
                    continue
            
            # 处理单行注释 //
            if char == '/' and i + 1 < length and code[i + 1] == '/':
                i += 2
                while i < length and code[i] != '\n':
                    i += 1
                if i < length:
                    result.append('\n')
                    i += 1
                continue
            
            # 处理多行注释 /* */
            if char == '/' and i + 1 < length and code[i + 1] == '*':
                i += 2
                while i < length - 1:
                    if code[i] == '*' and code[i + 1] == '/':
                        i += 2
                        break
                    i += 1
                continue
            
            result.append(char)
            i += 1
        
        return ''.join(result)
    
    cleaned_content = remove_comments(content_after_header)
    cleaned_content = re.sub(r'\n{3,}', '\n\n', cleaned_content)
    
    final_content = userscript_header + '\n' + cleaned_content if userscript_header else cleaned_content
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(final_content)
    
    print(f"处理完成！")
    print(f"原始文件: {input_file}")
    print(f"输出文件: {output_file}")

if __name__ == '__main__':
    input_file = r'f:\Users\PIAOPIAO\CodeBuddy\20260309\其他\用户端.js'
    output_file = r'f:\Users\PIAOPIAO\CodeBuddy\20260309\其他\用户端_无注释.js'
    remove_comments_from_js(input_file, output_file)
