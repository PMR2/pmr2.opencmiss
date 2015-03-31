import unittest
import json

from pmr2.opencmiss import api
from .data import load


class ApiTestCase(unittest.TestCase):
    """
    """

    def setUp(self):
        pass

    def test_to_threejs(self):
        graphics_descriptions = load('graphics_descriptions')
        source = load('cube.exformat')
        result = json.loads(load('cube.test_to_threejs.result.json'))
        answer = json.loads(api.to_threejs(source, graphics_descriptions))
        self.assertEqual(result, answer)
