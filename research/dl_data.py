import argparse
import gdown
import os
import shutil


parser = argparse.ArgumentParser()
parser.add_argument('--format', '-n', choices=['ArchHouseBINVOX', 'ArchHouseOBJ'], required=False, type=str)
args = parser.parse_args()

# ArchHouse01OriginalV001URL = "https://drive.google.com/uc?id=1YKXxxKLR68APCPe5tRfqLmASf7D9avCm"
# ArchHouse02AugmentedV001URL = "https://drive.google.com/uc?id=1acxY_7_G4Kq0vrMwHCKotaaX9RdqHpAY"

if args.format == 'ArchHouseBINVOX':
    id = "1tg78R_WkyCPVBpsG9uJnYkV5JAie3a2D"
    _output = "./dat/BINVOX.zip"
    print("Downloading ArchHouseBINVOX")
    gdown.download(id=id, output=_output, quiet=False)
    print("Successfully downloaded ArchHouseBINVOX")
    # gdown.download(ArchHouse02AugmentedV001URL, f'./dat/ArchHouse02AugmentedV001.zip')
    shutil.unpack_archive(f'./dat/BINVOX.zip', f'./dat')

    # Move contents of ./dat/BINVOX/* into ./dat/
    src_dir = './dat/BINVOX'
    dst_dir = './dat'

    for item in os.listdir(src_dir):
        s = os.path.join(src_dir, item)
        d = os.path.join(dst_dir, item)
        if os.path.isdir(s):
            shutil.move(s, d)
        else:
            shutil.move(s, d)

    shutil.rmtree(src_dir)

if args.format == 'ArchHouseOBJ':
    # gdown.download(ArchHouse02AugmentedV001URL, f'./dat/ArchHouse02AugmentedV001.zip')
    shutil.unpack_archive(f'./dat/ArchHouse02AugmentedV001.zip', f'./dat')