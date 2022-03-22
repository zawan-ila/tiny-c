
int rowpos[8];
int count;

int abs(int i){
    if (i < 0)
        return -i;
    return i;
}

int is_valid(int r, int c){
    for(int tmp = 0; tmp < r; tmp = tmp + 1){
        int row = tmp;
        int col = rowpos[tmp];

        if (col == c){
            return 0;
        }

        if (abs(r-row) == abs(c - col)){
            return 0;
        }
    }

    return 1;
}

int eight_queens(int r){

    for(int u = 0; u < 8; u = u + 1){
        rowpos[r] = u;
        if (is_valid(r, u)){
            if (r != 7)
                eight_queens(r + 1);
            else
                count = count + 1;
        }
    }
}

int main(){
    eight_queens(0);
    return count;

}