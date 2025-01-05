from setuptools import find_packages, setup

setup(
    name="mkdocs-annotations",
    version="0.1.0",
    description="MkDocs plugin for inline annotations and popovers",
    author="Your Name",
    author_email="your.email@example.com",
    packages=find_packages(),
    include_package_data=True,
    install_requires=["mkdocs>=1.0.4", "beautifulsoup4>=4.9.0"],
    entry_points={
        "mkdocs.plugins": [
            "annotations = mkdocs_annotations.plugin:AnnotationsPlugin",
        ]
    },
    package_data={
        "mkdocs_annotations": ["styles.css", "script.js"],
    },
)
