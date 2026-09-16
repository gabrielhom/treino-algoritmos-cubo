import json, itertools
# Facelet model built from 3D geometry. Faces order U R F D L B (Kociemba).
# Coordinates: x right, y up, z toward viewer (front).
FACES = ['U','R','F','D','L','B']
normals = {'U':(0,1,0),'R':(1,0,0),'F':(0,0,1),'D':(0,-1,0),'L':(-1,0,0),'B':(0,0,-1)}
# For each face, define the "right" and "down" direction vectors for row-major sticker layout,
# following standard net orientation (U seen from above with F at bottom; D seen from below with F at top).
axes = {
 'U': ((1,0,0),(0,0,1)),    # right=+x, down=+z (toward front)
 'D': ((1,0,0),(0,0,-1)),   # right=+x, down=-z (toward back)
 'F': ((1,0,0),(0,-1,0)),
 'B': ((-1,0,0),(0,-1,0)),
 'R': ((0,0,-1),(0,-1,0)),
 'L': ((0,0,1),(0,-1,0)),
}
def add(a,b): return tuple(x+y for x,y in zip(a,b))
def mul(a,k): return tuple(x*k for x in a)
pos=[]; nrm=[]
for f in FACES:
    n=normals[f]; r,d=axes[f]
    for i in range(3):
        for j in range(3):
            p = add(add(mul(n,3), mul(r,(j-1)*2)), mul(d,(i-1)*2))
            pos.append(p); nrm.append(n)
index = {(pos[k],nrm[k]):k for k in range(54)}
def rot(v, axis, quarter):
    # rotate vector v about axis (unit along x,y,z) by quarter*90deg, right-hand rule
    x,y,z=v
    for _ in range(quarter%4):
        if axis=='x': x,y,z = x, -z, y
        elif axis=='y': x,y,z = z, y, -x
        else: x,y,z = -y, x, z
    return (x,y,z)
# Face moves: clockwise looking at the face. R: about +x axis, clockwise from outside = rotation by -90 (right-hand about +x is counterclockwise seen from +x).
MOVE_DEF = {
 'R':('x',-1, lambda p: p[0]>0), 'L':('x',1, lambda p: p[0]<0),
 'U':('y',-1, lambda p: p[1]>0), 'D':('y',1, lambda p: p[1]<0),
 'F':('z',-1, lambda p: p[2]>0), 'B':('z',1, lambda p: p[2]<0),
 'x':('x',-1, lambda p: True), 'y':('y',-1, lambda p: True), 'z':('z',-1, lambda p: True),
 'M':('x',1, lambda p: p[0]==0 or abs(p[0])<3 and False) , # placeholder fixed below
}
def perm_for(axis, q, sel):
    # returns perm such that new_state[k] = old_state[perm[k]]
    perm=list(range(54))
    for k in range(54):
        p,n=pos[k],nrm[k]
        if sel(p):
            p2=rot(p,axis,q); n2=rot(n,axis,q)
            k2=index[(p2,n2)]
            perm[k2]=k
    return perm
# selectors by layer coordinate: a sticker belongs to the R layer if its position x>1 (x in {-3,-1,1,3} for face centers... actually positions have coords in {-3..3})
def layer(coord, cmp): return lambda p: cmp(p[coord])
MOVES={}
MOVES['R']=perm_for('x',-1, layer(0, lambda v: v>1))
MOVES['L']=perm_for('x',1, layer(0, lambda v: v<-1))
MOVES['U']=perm_for('y',-1, layer(1, lambda v: v>1))
MOVES['D']=perm_for('y',1, layer(1, lambda v: v<-1))
MOVES['F']=perm_for('z',-1, layer(2, lambda v: v>1))
MOVES['B']=perm_for('z',1, layer(2, lambda v: v<-1))
MOVES['M']=perm_for('x',1, layer(0, lambda v: abs(v)<=1))
MOVES['E']=perm_for('y',1, layer(1, lambda v: abs(v)<=1))
MOVES['S']=perm_for('z',-1, layer(2, lambda v: abs(v)<=1))
MOVES['x']=perm_for('x',-1, lambda p: True)
MOVES['y']=perm_for('y',-1, lambda p: True)
MOVES['z']=perm_for('z',-1, lambda p: True)
MOVES['r']=perm_for('x',-1, layer(0, lambda v: v>-2))
MOVES['l']=perm_for('x',1, layer(0, lambda v: v<2))
MOVES['u']=perm_for('y',-1, layer(1, lambda v: v>-2))
MOVES['d']=perm_for('y',1, layer(1, lambda v: v<2))
MOVES['f']=perm_for('z',-1, layer(2, lambda v: v>-2))
MOVES['b']=perm_for('z',1, layer(2, lambda v: v<2))

def apply_perm(state, perm): return [state[perm[k]] for k in range(54)]
def compose(state, moves):
    for m in moves:
        base=m[0]; suf=m[1:]
        n = 1 if suf=='' else (2 if suf=='2' else 3)
        for _ in range(n): state=apply_perm(state, MOVES[base])
    return state
def parse(alg): return alg.replace("2'","2").replace("Dw","d").split()
def invert(moves):
    out=[]
    for m in reversed(moves):
        b=m[0]; s=m[1:]
        out.append(b if s=="'" else (b+"2" if s=="2" else b+"'"))
    return out
SOLVED=[FACES[k//9] for k in range(54)]
IDS=list(range(54))
# sanity: R^4 identity, sexy move ^6 identity
assert compose(SOLVED, ['R']*4)==SOLVED
assert compose(list(range(54)), parse("R U R' U' "*6))==IDS
assert compose(IDS, parse("R L' x'"))==compose(IDS, ['M'])
assert compose(IDS, parse("x L"))==compose(IDS,['r'])
assert compose(IDS, parse("y' U"))==compose(IDS,['d'])

# piece membership via sticker positions
def piece_of(k):
    p=pos[k]; return tuple(1 if c>1 else (-1 if c<-1 else 0) for c in p)
PAIR = {(1,-1,1), (1,0,1)}  # DFR corner, FR edge
def is_U(k): return piece_of(k)[1]==1
CASES = {
1:"U R U' R'", 2:"F' U' F", 3:"U' F' U F", 4:"R U R'",
5:"U' R U R' U2 R U' R'", 6:"U' R U2 R' U2 R U' R'", 7:"U F' U' F U2 F' U F", 8:"U F' U2 F U2 F' U F",
9:"U' R U' R' U F' U' F", 10:"U' R U2 R' U F' U' F", 11:"U F' U F U' F' U' F", 12:"U' R U R' U R U R'",
13:"U R U' R' U' R U R' U' R U R'", 14:"U' R U' R' U R U R'", 15:"U R' F R F' U R U R'", 16:"R U2 R' U' R U R'",
17:"R U' R' U2 F' U' F", 18:"F' U2 F U F' U' F", 19:"U R U2 R' U R U' R'", 20:"U2 R U R' U R U' R'",
21:"U' F' U2 F U' F' U F", 22:"U2 F' U' F U' F' U F", 23:"U R U' R' U' R U' R' U R U' R'", 24:"F U R U' R' F' R U' R'",
25:"U' R' F R F' R U R'", 26:"R U' R' U R U' R'", 27:"F' U' F U F' U' F", 28:"U R U' R' U' F' U F",
29:"F' U F U' F' U F", 30:"R U R' U' R U R'", 31:"R U' R' F' U2 F", 32:"U' R U' R' U2 R U' R'",
33:"U' R U R' U F' U' F", 34:"R U R' U' R U R' U' R U R'", 35:"U' R U2 R' U R U R'", 36:"U F' U' F U' R U R'",
37:"R U' R' U' R U R' U2 R U' R'", 38:"R U' R' U F' U' F U' F' U' F", 39:"R U' R' U F' U2 F U2 F' U F", 40:"R U' R' U R U2 R' U R U' R'",
41:"R U' R' U2 F' U' F U' F' U F",
}
# also check the site's rotation versions equal ours
CHECK = {31:"R U' R' y' R' U2 R", 33:"U' R U R' d R' U' R", 39:"R U' R' Dw R' U2 R U2' R' U R", 41:"R U' R' U d R' U' R U' R' U R", 38:"R U' R' U y' R' U' R U' R' U' R", 3:"y' U' R' U R", 11:"y' U R' U R U' R' U' R", 36:"y' U R' U' R d' R U R'"}
def strip_rot(state):
    # canonicalize orientation: rotate y until F center is F
    for k in range(4):
        if state[2*9+4]=='F' and state[0*9+4]=='U': return state
        state=compose(state,['y'])
    raise Exception
def key_state(scr_ids):
    # canonical key up to AUF: where the pair stickers are
    best=None
    for k in range(4):
        s=compose(scr_ids,['U']*k)
        key=tuple((s.index(i)) for i in range(54) if piece_of(i) in PAIR)
        if best is None or key<best: best=key
    return best
ok=True; keys={}
for n,alg in CASES.items():
    scr=invert(parse(alg))
    s_ids=compose(IDS, scr)
    # validation: all stickers not (U-layer piece or pair piece) must be home
    for k in range(54):
        origin=s_ids[k]
        if not (is_U(k) or piece_of(k) in PAIR or is_U(origin) or piece_of(origin) in PAIR):
            if origin!=k: ok=False; print("case",n,"disturbs non-F2L sticker",k); break
    # pair pieces must be in U layer or in slot
    for k in range(54):
        if piece_of(s_ids[k]) in PAIR and not (is_U(k) or piece_of(k) in PAIR): ok=False; print("case",n,"pair piece elsewhere")
    kk=key_state(s_ids)
    if kk in keys: print("DUP",n,keys[kk]); ok=False
    keys[kk]=n
for n,alg in CHECK.items():
    a=strip_rot(compose(SOLVED, invert(parse(alg)))); b=compose(SOLVED, invert(parse(CASES[n])))
    print("rot-check",n, a==b)
print("valid:",ok, "distinct:",len(keys))
json.dump({'moves':{k:v for k,v in MOVES.items()}, 'pos':pos, 'faces':FACES}, open('tables.json','w'))

def solved_up_to_rot(state):
    for k in range(4):
        s=compose(state,['y']*k)
        if s==SOLVED: return True
    return False
for n,alg in CHECK.items():
    case_state=compose(SOLVED, invert(parse(CASES[n])))
    after=compose(case_state, parse(alg))
    print("site alg solves my case", n, solved_up_to_rot(after))
