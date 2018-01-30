import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { File } from '@ionic-native/file'
import ImgCache from 'imgcache.js';

/**
 * This service is charged of provide the methods to cache the images
 */
@Injectable()
export class ImageCacheService {

  public imgQueue: string[] = [];
  public isAndroid: boolean = true;
  constructor(platform: Platform) {
    ImgCache.options.debug = true;
    ImgCache.options.cacheClearSize = 30;
    if (platform.is('ios')) {
      ImgCache.options.cordovaFilesystemRoot = new File().documentsDirectory;
      this.isAndroid = false;
    }
  }

  /**
   * Init imgCache library
   * @return {Promise}
   */
  public initImageCache(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (ImgCache.ready) {
        resolve();
      } else {
        ImgCache.init(() => resolve(), () => reject());
      }
    });
  }

  public isCached(src: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ImgCache.isCached(src, (path: string, success: boolean) => {
        // if not, it will be cached
        resolve(success);
      });
    });
  }

  /**
   * Cache images
   * @param src {string} - img source
   */
  public cacheImage(src: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ImgCache.isCached(src, (path: string, success: boolean) => {
        // if not, it will be cached
        if (success) {
          ImgCache.getCachedFileURL(src,
            (originalUrl, cacheUrl) => {
              if (!this.isAndroid) {
                const file = new File();
                const cacheFileUrl = cacheUrl.replace('cdvfile://localhost/persistent/', file.documentsDirectory);
                const localServerFileUrl = cacheFileUrl.replace('file://', 'http://localhost:8080');
                resolve(localServerFileUrl);
              } else {
                resolve(cacheUrl);
              }
            },
            (e) => {
              console.error('img-cache-error:', e);
              reject(e)
            });
        } else {
          // cache img
          ImgCache.cacheFile(src);
          // return original img URL
          resolve(src);
        }
      });
    });
  }

  public clearCache() {
    ImgCache.clearCache();
  }

  public getCacheSize() {
    console.log("The cache size is ", ImgCache.getCurrentSize());
  }
}
