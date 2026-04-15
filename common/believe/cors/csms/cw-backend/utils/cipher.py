import base64
import hashlib

from Crypto import Random
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from ezedox.settings import ENCRYPTION_KEY


class AESCipher(object):

    def __init__(self):
        self.bs = 32
        self.key = hashlib.sha256(ENCRYPTION_KEY.encode("utf8")).digest()

    def encrypt(self, raw):
        raw = pad(raw.encode("utf8"), self.bs)
        iv = Random.new().read(AES.block_size)
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        return base64.b64encode(iv + cipher.encrypt(raw)).decode('utf-8')

    def decrypt(self, enc):
        enc = base64.b64decode(enc)
        iv = enc[:AES.block_size]
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        return unpad(cipher.decrypt(enc[AES.block_size:]), self.bs).decode('utf-8')
