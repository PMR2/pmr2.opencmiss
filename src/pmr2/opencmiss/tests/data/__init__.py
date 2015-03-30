import os.path

path = lambda fn: os.path.join(os.path.dirname(__file__), fn)

def load(fn):
    with open(path(fn)) as fd:
        return fd.read()
