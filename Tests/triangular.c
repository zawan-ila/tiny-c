
int triangular(int n){
    int sum = 0;
    for(int i = 1; i <= n; i = i + 1){
        sum = sum + i;
    }
    return sum;
}


int main(){
    int y = 10;
    int ans = triangular(y);
    return ans;
}