

int main(){

    int a = 88;
    int b = 11;
    {
        int b = 77;
        b = b + a;
        a = a + b;
    }

    {
        int c = 33;
        int a = 22;
        {
            a = a + c;
        }
    }


    return a;


}