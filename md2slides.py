#!/usr/bin/env python3
import re
import os
import argparse

# Utils

def extract_title(file_path: str) -> str:
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            for line in lines:
                if line.strip() == '---':
                    title_match = re.search(
                        r'^title:\s*(.*)$', lines[lines.index(line) + 1])
                    if title_match:
                        return title_match.group(1).strip()
            # If no title attribute found, 'untitled' as default
            return 'untitled'
    except FileNotFoundError:
        print("File not found")
        return None


def create_file(output_dir, file_name, content):
    try:
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        file_path = os.path.join(output_dir, file_name)
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)

        print(f"File {file_name} created successfully.")
        return file_path
    except Exception as e:
        print("Error occurred: ", e)
        return None


def replace_text_in_file(file_path : str,
                         md_file_name, title):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            file_content = file.read()
            
        new_content = replace_md_source(md_file_name, file_content)
        new_content = add_title(title, new_content)

        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(new_content)

        print(f"File {file_path} updated successfully.")
        return True
    except Exception as e:
        print("Error occurred: ", e)
        return False



def replace_md_source(md_file_name, html_template) -> str:
    return html_template.replace('<section data-markdown="file.md"',
                              f'<section data-markdown="{md_file_name}"')

def add_title(title, html_template) -> str:
    html_template = \
        html_template.replace('<title></title>', f'<title>{title}</title>')
    return html_template.replace('<h1 class="title"></h1>', f'<h1 class="title">{title}</h1>')

def remove_md_attributes(md_file):
    try:
        with open(md_file, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        with open(md_file, 'w', encoding='utf-8') as file:
            inside_header = False
            for line in lines:
                if line.strip() == '---':
                    inside_header = not inside_header
                elif not inside_header:
                    file.write(line)
    except FileNotFoundError:
        print("File not found")


# Parser arguments

parser = argparse.ArgumentParser()
parser.add_argument('md_file_name', metavar='md_file_name',
                    type=str, help='Markdown file name, [*.md] is required')
parser.add_argument('--path', metavar='directory_path', type=str,
                    default='markdown/', help='Markdown files directory, markdown/ as default')
args = parser.parse_args()

###

full_file_path = os.path.join(args.path, args.md_file_name)
title = extract_title(full_file_path)

template_path = "templates/template.html"  # 模板文件路径
output_dir = "output"  # 输出目录
output_file_name = "index.html"  # 输出文件名

with open(template_path, 'r', encoding='utf-8') as template_file:
    template_content = template_file.read()

with open(full_file_path, 'r', encoding='utf-8') as md_file:
    md_content = md_file.read()

new_file_path = create_file(output_dir, output_file_name, template_content)
new_md_file = create_file(output_dir, args.md_file_name, md_content)

if new_file_path:
    replace_text_in_file(new_file_path, args.md_file_name, title)

if new_md_file:
    remove_md_attributes(new_md_file)