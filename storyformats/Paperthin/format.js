window.storyFormat({"name":"Paperthin","version":"1.0","description":"The default proofing format for Twine 2. Icon designed by <a href=\"http://www.thenounproject.com/Simon Child\">Simon Child</a> from the <a href=\"http://www.thenounproject.com\">Noun Project</a>","author":"<a href=\"http://chrisklimas.com\">Chris Klimas</a>","image":"icon.svg","url":"http://twinery.org/","license":"ZLib/Libpng","proofing":true,"source":"<!DOCTYPE html>\n<html>\n<head>\n<title>{{STORY_NAME}}\n</title>\n<meta charset=\"utf-8\">\n<style>\nbody\n{\n\tfont: 10pt Cousine, monospace;\n\tmargin: 2em;\n}\n\nh1\n{\n\tfont-size: 14pt;\n\ttext-align: center;\n\tmargin-bottom: 2em;\n}\n\ntw-passagedata\n{\n\tdisplay: block !important;\n\tline-height: 200%;\n\tmargin-bottom: 2em;\n\twhite-space: pre-wrap;\n}\n\ntw-passagedata + tw-passagedata\n{\n\tborder-top: 1pt dashed black;\n\tpadding-top: 2em;\n}\n\ntw-passagedata:before\n{\n\tcontent: attr(name);\n\tdisplay: block;\n\tfont-weight: bold;\n}\n</style>\n</head>\n\n<body>\n\n<h1>{{STORY_NAME}}\n</h1>\n{{STORY_DATA}}\n\n\n</body>\n</html>\n"});