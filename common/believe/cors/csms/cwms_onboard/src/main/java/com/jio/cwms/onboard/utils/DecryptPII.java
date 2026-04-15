package com.jio.cwms.onboard.utils;

import java.security.spec.KeySpec;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

public class DecryptPII {

    public static String decrypt(String cipherText) throws Exception {
        if (cipherText == null || cipherText.trim().isEmpty()) {
            return "";
        }

        String encryptionKey = "MAKV2SPBNI99212";
        byte[] salt = new byte[] {
            (byte) 0x49, (byte) 0x76, (byte) 0x61, (byte) 0x6e,
            (byte) 0x20, (byte) 0x4d, (byte) 0x65, (byte) 0x64,
            (byte) 0x76, (byte) 0x65, (byte) 0x64, (byte) 0x65,
            (byte) 0x76
        };

        byte[] cipherBytes = Base64.getDecoder().decode(cipherText);

        // Key Derivation
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        KeySpec spec = new PBEKeySpec(encryptionKey.toCharArray(), salt, 1000, 256 + 128);
        byte[] keyAndIv = factory.generateSecret(spec).getEncoded();

        byte[] key = new byte[32];
        byte[] iv = new byte[16];
        System.arraycopy(keyAndIv, 0, key, 0, 32);
        System.arraycopy(keyAndIv, 32, iv, 0, 16);

        SecretKeySpec secretKey = new SecretKeySpec(key, "AES");
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        // Decrypt
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);
        byte[] decryptedBytes = cipher.doFinal(cipherBytes);

        return new String(decryptedBytes, "UTF-16LE");
    }
	
}
