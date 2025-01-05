import os
import re

from bs4 import BeautifulSoup
from mkdocs.plugins import BasePlugin


class AnnotationsPlugin(BasePlugin):
    # Updated pattern to be more specific and handle markdown content better
    annotation_pattern = r"\[\[([^\]]+?)\]\{([^\}]+?)\}\]"

    def __init__(self):
        super().__init__()
        self.popovers = {}

    def on_page_content(self, html, page, config, files):
        try:
            # First process any existing popover definitions
            soup = BeautifulSoup(html, "html.parser")

            # Store and remove popover definitions - now handle any div with an id
            for div in soup.find_all("div", id=True):
                popover_id = div["id"]
                self.popovers[popover_id] = str(div)
                # Don't remove the div anymore so it remains available for JavaScript
                # div.decompose()

            # Process text nodes only (avoid processing inside pre/code blocks)
            def process_text_node(node):
                if node.parent.name in ["pre", "code"]:
                    return

                text = node.string
                if not text or not re.search(self.annotation_pattern, text):
                    return

                parts = []
                last_end = 0

                for match in re.finditer(self.annotation_pattern, text):
                    start, end = match.span()

                    # Add text before the match
                    if start > last_end:
                        parts.append(text[last_end:start])

                    # Process the annotation
                    content = match.group(1)
                    annotations = match.group(2).split("|")

                    # Create annotation container
                    container = self.create_annotation_html(content, annotations)
                    parts.append(container)

                    last_end = end

                # Add remaining text
                if last_end < len(text):
                    parts.append(text[last_end:])

                # Replace the text node with processed content
                if parts:
                    new_elements = BeautifulSoup("".join(parts), "html.parser")
                    node.replace_with(new_elements)

            # Process all text nodes
            text_nodes = soup.find_all(string=True)
            for node in text_nodes:
                process_text_node(node)

            return str(soup)

        except Exception as e:
            print(f"Error processing annotations: {str(e)}")
            return html

    def create_annotation_html(self, text, annotations):
        # Escape the annotations for HTML attribute
        escaped_annotations = [
            annotation.replace('"', "&quot;").replace("'", "&apos;")
            for annotation in annotations
        ]

        # Create data attribute with annotations
        data_annotations = "|".join(escaped_annotations)

        container = f'<span class="annotation-container" data-annotations="{data_annotations}">{text}</span>'
        return container

    def on_post_page(self, output, page, config):
        try:
            if "</head>" in output:
                css = self._get_resource("styles.css")
                js = self._get_resource("script.js")
                # Insert resources before </head>
                output = output.replace("</head>", f"{css}{js}</head>")
            return output
        except Exception as e:
            print(f"Error injecting resources: {str(e)}")
            return output

    def _get_resource(self, filename):
        try:
            resource_path = os.path.join(os.path.dirname(__file__), filename)
            if not os.path.exists(resource_path):
                print(f"Resource not found: {resource_path}")
                return ""

            with open(resource_path, "r", encoding="utf-8") as f:
                content = f.read()

            if filename.endswith(".css"):
                return f"<style>{content}</style>"
            elif filename.endswith(".js"):
                return f"<script>{content}</script>"
            return ""
        except Exception as e:
            print(f"Error loading resource {filename}: {str(e)}")
            return ""
