import unittest

from mkdocs_annotations.plugin import AnnotationsPlugin


class TestAnnotationsPlugin(unittest.TestCase):
    def setUp(self):
        self.plugin = AnnotationsPlugin()

    def test_basic_annotation(self):
        content = "Test [[text]{annotation}]"
        expected = 'Test <span class="annotation-container">text<div class="popover">annotation</div></span>'
        result = self.plugin.on_page_content(content, None, None, None)
        self.assertEqual(result.strip(), expected.strip())

    def test_multiple_annotations(self):
        content = "Test [[text]{note1|note2}]"
        result = self.plugin.on_page_content(content, None, None, None)
        self.assertIn("popovers-container", result)
        self.assertIn("note1", result)
        self.assertIn("note2", result)

    def test_popover_reference(self):
        content = """
        <div id="pop-test">Test definition</div>
        Test [[text]{#pop-test}]
        """
        result = self.plugin.on_page_content(content, None, None, None)
        self.assertIn("Test definition", result)
        self.assertNotIn('id="pop-test">', result)

    def test_code_block_protection(self):
        content = """
        <pre><code>
        This [[should not]{be processed}]
        </code></pre>
        But this [[should]{be processed}]
        """
        result = self.plugin.on_page_content(content, None, None, None)
        self.assertIn("[[should not]{be processed}]", result)
        self.assertIn('<span class="annotation-container">should', result)

    def test_nested_annotations(self):
        content = """
        <div>Test [[text1]{note1}] and [[text2]{note2}]</div>
        """
        result = self.plugin.on_page_content(content, None, None, None)
        self.assertIn("text1", result)
        self.assertIn("text2", result)
        self.assertIn("note1", result)
        self.assertIn("note2", result)
